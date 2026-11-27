export const defaultBaseUrl = 'http://localhost:4000'

export const baseUrl = (import.meta.env.VITE_API_URL ?? defaultBaseUrl).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(code, message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error
  if (error?.name === 'AbortError') return error
  return new ApiError(
    error?.code ?? 'UNKNOWN_ERROR',
    error?.message ?? 'Ocurrió un error inesperado',
    error?.status ?? 0,
    error?.details
  )
}

function isFormData(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

function buildHeaders(headers, body) {
  const result = { ...headers }
  if (body !== undefined && !isFormData(body)) result['Content-Type'] = 'application/json'
  return result
}

async function parseError(response) {
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  const details = payload?.error ?? payload
  return new ApiError(
    details?.code ?? 'HTTP_ERROR',
    details?.message ?? `La solicitud falló (${response.status})`,
    response.status,
    details
  )
}

export async function request(path, options = {}) {
  const { method = 'GET', body, headers, signal, responseType = 'json' } = options
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: buildHeaders(headers, body),
      credentials: 'include',
      body: body === undefined ? undefined : isFormData(body) ? body : JSON.stringify(body),
      signal
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('NETWORK_ERROR', 'No se pudo conectar con el servidor', 0)
  }

  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return null
  if (responseType === 'blob') return response.blob()
  return response.json()
}

export const api = {
  request,
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  downloadBlob: (path, options) => request(path, { ...options, responseType: 'blob' })
}

export function buildFileUrl(documentId) {
  return `${baseUrl}/api/documents/${documentId}/file`
}

export function buildEventsUrl(evaluationId) {
  return `${baseUrl}/api/evaluations/${evaluationId}/events`
}

export async function downloadFile(path, fileName) {
  const blob = await api.downloadBlob(path)
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

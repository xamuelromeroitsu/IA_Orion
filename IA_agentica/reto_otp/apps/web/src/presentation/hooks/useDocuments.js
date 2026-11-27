import { useCallback, useEffect, useState } from 'react'
import { useApi } from './useApi'

const emptyDocuments = { documents: [], analyses: [] }

export function useDocuments(projectId) {
  const { data, error, isLoading, get, send, setData } = useApi(emptyDocuments)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [analysisErrors, setAnalysisErrors] = useState([])
  const [documentUploadErrors, setDocumentUploadErrors] = useState([])

  const load = useCallback(async () => {
    if (!projectId) return emptyDocuments
    return get(`/api/projects/${projectId}/documents`)
  }, [projectId, get])

  useEffect(() => {
    setAnalysisErrors([])
    setDocumentUploadErrors([])
    if (!projectId) {
      setData(emptyDocuments)
      return
    }
    load().catch(() => {})
  }, [projectId, load, setData])

  const upload = useCallback(
    async (files) => {
      if (!projectId) throw new Error('Selecciona un proyecto antes de subir archivos')
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      setIsUploading(true)
      setUploadError(null)
      setAnalysisErrors([])
      setDocumentUploadErrors([])
      try {
        const result = await send(`/api/projects/${projectId}/documents`, {
          method: 'POST',
          body: formData
        })
        setData({
          documents: result?.documents ?? [],
          analyses: result?.analyses ?? []
        })
        setAnalysisErrors(result?.analysisErrors ?? [])
        setDocumentUploadErrors(result?.uploadErrors ?? [])
        return result
      } catch (caught) {
        setUploadError(caught)
        throw caught
      } finally {
        setIsUploading(false)
      }
    },
    [projectId, send, setData]
  )

  return {
    documents: data?.documents ?? [],
    analyses: data?.analyses ?? [],
    error,
    isLoading,
    isUploading,
    uploadError,
    analysisErrors,
    documentUploadErrors,
    upload,
    reload: load
  }
}

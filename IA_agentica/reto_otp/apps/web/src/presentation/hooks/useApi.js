import { useCallback, useState } from 'react'
import { api, normalizeApiError } from '../lib/api'

export function useApi(initialData = null) {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const get = useCallback(async (path, options = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.get(path, options)
      setData(result)
      return result
    } catch (caught) {
      const normalized = normalizeApiError(caught)
      setError(normalized)
      throw normalized
    } finally {
      setIsLoading(false)
    }
  }, [])

  const send = useCallback(async (path, options = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.request(path, options)
      setData(result)
      return result
    } catch (caught) {
      const normalized = normalizeApiError(caught)
      setError(normalized)
      throw normalized
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { data, error, isLoading, get, send, setData, setError }
}

import { useEffect, useState } from 'react'
import { api, normalizeApiError } from '../lib/api'

export function useRates() {
  const [rates, setRates] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    api
      .get('/api/rates/bcv')
      .then((result) => {
        if (isMounted) setRates(result)
      })
      .catch((caught) => {
        if (isMounted) setError(normalizeApiError(caught))
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  return { rates, error, isLoading }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, normalizeApiError } from '../lib/api'
import { isTerminalStatus } from '../lib/constants'
import { useEvaluationStore } from '../store/evaluation'
import { useSessionStore } from '../store/session'

export function useEvaluation() {
  const setActiveEvaluationId = useEvaluationStore((state) => state.setActiveEvaluationId)
  const clearEvents = useEvaluationStore((state) => state.clearEvents)
  const upsertEvaluation = useSessionStore((state) => state.upsertEvaluation)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState(null)

  const startEvaluation = useCallback(
    async (projectId) => {
      if (!projectId) throw new Error('Selecciona un proyecto antes de evaluar')
      setIsStarting(true)
      setError(null)
      clearEvents()
      try {
        const result = await api.post('/api/evaluations', { projectId })
        const evaluation = result?.evaluation ?? result
        setActiveEvaluationId(evaluation.id)
        upsertEvaluation(evaluation)
        return evaluation
      } catch (caught) {
        const normalized = normalizeApiError(caught)
        setError(normalized)
        throw normalized
      } finally {
        setIsStarting(false)
      }
    },
    [clearEvents, setActiveEvaluationId, upsertEvaluation]
  )

  return { startEvaluation, isStarting, error }
}

export function useEvaluationDetails(evaluationId, { poll = false, stopWhenComplete = false } = {}) {
  const [details, setDetails] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const detailsRef = useRef(null)

  const load = useCallback(async () => {
    if (!evaluationId) return null
    setIsLoading(true)
    try {
      const result = await api.get(`/api/evaluations/${evaluationId}`)
      detailsRef.current = result
      setDetails(result)
      setError(null)
      return result
    } catch (caught) {
      const normalized = normalizeApiError(caught)
      setError(normalized)
      throw normalized
    } finally {
      setIsLoading(false)
    }
  }, [evaluationId])

  useEffect(() => {
    if (!evaluationId) {
      detailsRef.current = null
      setDetails(null)
      return undefined
    }
    load().catch(() => {})
    if (!poll) return undefined
    const timer = window.setInterval(() => {
      if (stopWhenComplete && isTerminalStatus(detailsRef.current?.evaluation?.status)) {
        window.clearInterval(timer)
        return
      }
      load().catch(() => {})
    }, 2500)
    return () => window.clearInterval(timer)
  }, [evaluationId, poll, stopWhenComplete, load])

  return {
    evaluation: details?.evaluation ?? null,
    analyses: details?.analyses ?? [],
    documents: details?.documents ?? [],
    isLoading,
    error,
    reload: load,
    isComplete: isTerminalStatus(details?.evaluation?.status)
  }
}

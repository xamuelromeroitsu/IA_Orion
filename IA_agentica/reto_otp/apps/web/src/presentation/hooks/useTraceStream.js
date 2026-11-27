import { useEffect, useState } from 'react'
import { buildEventsUrl } from '../lib/api'
import { useEvaluationStore } from '../store/evaluation'

export function useTraceStream(evaluationId, { enabled = true, isComplete = false } = {}) {
  const addEvent = useEvaluationStore((state) => state.addEvent)
  const setStreaming = useEvaluationStore((state) => state.setStreaming)
  const events = useEvaluationStore((state) => state.events)
  const isStreaming = useEvaluationStore((state) => state.isStreaming)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !evaluationId || isComplete) return undefined

    let isClosed = false
    let retryTimer = null
    let source = null

    const openStream = () => {
      setStreaming(true)
      setError(null)
      source = new EventSource(buildEventsUrl(evaluationId), { withCredentials: true })

      source.onmessage = (message) => {
        try {
          addEvent(JSON.parse(message.data))
        } catch {
          addEvent({
            at: new Date().toISOString(),
            phase: 'traza',
            tool: 'evento',
            message: message.data,
            level: 'info'
          })
        }
      }

      source.onerror = () => {
        source?.close()
        source = null
        setStreaming(false)
        if (isClosed || isComplete) return
        setError({ code: 'SSE_DISCONNECTED', message: 'Conexión de traza interrumpida; reconectando…' })
        retryTimer = window.setTimeout(() => setAttempt((value) => value + 1), 2500)
      }
    }

    openStream()

    return () => {
      isClosed = true
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      source?.close()
      setStreaming(false)
    }
  }, [evaluationId, enabled, isComplete, addEvent, setStreaming, attempt])

  return { events, isStreaming, error }
}

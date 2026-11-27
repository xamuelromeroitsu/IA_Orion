import { useCallback, useState } from 'react'
import { api, normalizeApiError } from '../lib/api'

export function useChat(evaluationId) {
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Pregúntame sobre el dictamen, los costos ocultos o la evidencia de las propuestas.',
      sources: []
    }
  ])
  const [question, setQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)

  const buildId = useCallback(() => `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, [])

  const sendQuestion = useCallback(
    async (rawQuestion) => {
      const trimmed = String(rawQuestion ?? '').trim()
      if (!trimmed || !evaluationId || isSending) return
      setMessages((current) => [...current, { id: buildId(), role: 'user', content: trimmed }])
      setQuestion('')
      setIsSending(true)
      setError(null)
      try {
        const result = await api.post(`/api/evaluations/${evaluationId}/chat`, { question: trimmed })
        setMessages((current) => [
          ...current,
          {
            id: buildId(),
            role: 'assistant',
            content: result?.answer ?? 'El servidor no devolvió una respuesta.',
            sources: result?.sources ?? []
          }
        ])
      } catch (caught) {
        const normalized = normalizeApiError(caught)
        setError(normalized)
        setMessages((current) => [
          ...current,
          { id: buildId(), role: 'assistant', content: normalized.message, isError: true, sources: [] }
        ])
      } finally {
        setIsSending(false)
      }
    },
    [evaluationId, isSending, buildId]
  )

  return { messages, question, setQuestion, isSending, error, sendQuestion }
}

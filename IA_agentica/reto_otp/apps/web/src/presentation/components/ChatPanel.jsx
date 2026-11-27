import { useEffect, useRef } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { suggestedQuestions } from '../lib/constants'
import { useChat } from '../hooks/useChat'

function SourceList({ sources }) {
  if (!sources?.length) return null
  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fuentes</p>
      <ul className="space-y-1">
        {sources.map((source, index) => (
          <li key={`${source}-${index}`} className="break-words text-[11px] leading-relaxed text-sky-200">
            {source}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ChatPanel({ evaluationId }) {
  const { messages, question, setQuestion, isSending, error, sendQuestion } = useChat(evaluationId)
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages.length, isSending])

  const handleSubmit = (event) => {
    event.preventDefault()
    sendQuestion(question)
  }

  return (
    <section className="orion-card flex h-[min(76vh,760px)] flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orion-blue/15 text-sky-300">
          <MessageCircle size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-orion-text">Chat documental</h2>
          <p className="text-xs text-slate-400">Respuestas basadas en las propuestas analizadas</p>
        </div>
      </header>

      <div ref={listRef} className="orion-scroll flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message) => {
          const isUser = message.role === 'user'
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-orion-blue text-white'
                    : message.isError
                      ? 'border border-red-400/25 bg-red-500/10 text-red-100'
                      : 'border border-white/10 bg-orion-background/60 text-orion-text'
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
                {!isUser ? <SourceList sources={message.sources} /> : null}
              </div>
            </div>
          )
        })}
        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-white/10 bg-orion-background/60 px-4 py-3 text-xs text-slate-300">
              Analizando evidencias…
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-white/10 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-orion-blue/50 hover:text-orion-text"
              disabled={isSending || !evaluationId}
              onClick={() => sendQuestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
        {error ? <p className="text-xs text-red-300">{error.message}</p> : null}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            className="orion-input"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Escribe tu pregunta…"
            disabled={!evaluationId || isSending}
          />
          <button type="submit" className="orion-button orion-button-yellow shrink-0 px-3" disabled={!evaluationId || isSending || !question.trim()} aria-label="Enviar pregunta">
            <Send size={17} />
          </button>
        </form>
        {!evaluationId ? <p className="text-xs text-slate-400">Selecciona una evaluación para habilitar el chat.</p> : null}
      </div>
    </section>
  )
}

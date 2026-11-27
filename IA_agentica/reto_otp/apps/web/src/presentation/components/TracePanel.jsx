import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'
import { phaseClasses } from '../lib/constants'
import { formatTime } from '../lib/formatters'
import StatusBadge from './StatusBadge'

export default function TracePanel({ events = [], isStreaming = false }) {
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [events.length])

  return (
    <section className="orion-card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orion-blue/15 text-sky-300">
            <Terminal size={18} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-orion-text">Trazabilidad en vivo</h2>
            <p className="text-xs text-slate-400">{events.length} evento(s) registrados</p>
          </div>
        </div>
        <StatusBadge status={isStreaming ? 'running' : 'idle'} label={isStreaming ? 'En vivo' : 'En espera'} tone={isStreaming ? 'warning' : 'neutral'} />
      </header>

      <div ref={listRef} className="orion-scroll max-h-[420px] space-y-2 overflow-y-auto p-4">
        {events.length ? (
          events.map((event) => (
            <div
              key={event.key ?? `${event.at}-${event.phase}-${event.message}`}
              className={`rounded-lg border-l-2 px-3 py-2 ${phaseClasses(event.phase)}`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                <span className="font-mono text-slate-400">{formatTime(event.at)}</span>
                <span className="font-semibold uppercase tracking-wide text-sky-200">{event.phase || 'evento'}</span>
                {event.tool ? <span className="rounded bg-white/10 px-1.5 py-0.5 text-slate-300">{event.tool}</span> : null}
                {event.level ? <span className="text-orion-yellow">{event.level}</span> : null}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-orion-text">{event.message}</p>
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-slate-400">Los eventos de la corrida aparecerán aquí en tiempo real.</p>
        )}
      </div>
    </section>
  )
}

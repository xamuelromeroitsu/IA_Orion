import { useNavigate } from 'react-router-dom'
import { MessageSquare, MessagesSquare } from 'lucide-react'
import ChatPanel from '../components/ChatPanel'
import EmptyState from '../components/EmptyState'
import { LoadingBlock } from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import { useEvaluationDetails } from '../hooks/useEvaluation'
import { useEvaluationStore } from '../store/evaluation'
import { useSessionStore } from '../store/session'

export default function ChatPage() {
  const navigate = useNavigate()
  const evaluations = useSessionStore((state) => state.evaluations)
  const projects = useSessionStore((state) => state.projects)
  const activeProjectId = useSessionStore((state) => state.activeProjectId)
  const activeEvaluationId = useEvaluationStore((state) => state.activeEvaluationId)
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null
  const evaluationId = activeEvaluationId ?? evaluations.find((evaluation) => !activeProject || evaluation.projectId === activeProject.id)?.id ?? null
  const details = useEvaluationDetails(evaluationId)

  if (!evaluationId) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Sin evaluación para consultar"
        description="El chat responde preguntas sobre una corrida culminada y cita las fuentes de cada respuesta."
        actionLabel="Ir a evaluación"
        onAction={() => navigate('/evaluacion')}
      />
    )
  }

  if (details.isLoading && !details.evaluation) {
    return <LoadingBlock label="Cargando evaluación…" lines={4} />
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orion-yellow">Preguntas con evidencia</p>
          <h2 className="mt-1 text-2xl font-bold text-orion-text">Chat documental</h2>
          <p className="mt-1 text-sm text-slate-300">{activeProject?.name ?? 'Evaluación activa'}</p>
        </div>
        {details.evaluation ? <StatusBadge status={details.evaluation.status} /> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <ChatPanel evaluationId={evaluationId} />
        <aside className="orion-card h-fit space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orion-blue/15 text-sky-300">
              <MessagesSquare size={18} />
            </span>
            <h3 className="text-sm font-semibold text-orion-text">Cómo funciona</h3>
          </div>
          <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
            <li>· Las respuestas se generan solo con el contenido de las propuestas analizadas.</li>
            <li>· Cada respuesta muestra sus fuentes para que puedas contrastarla.</li>
            <li>· Puedes preguntar por hallazgos, costos ocultos o motivos de descarte.</li>
          </ul>
          <div className="rounded-xl bg-orion-background/50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">ID de evaluación</p>
            <p className="mt-1 break-all font-mono text-[11px] text-orion-yellow">{evaluationId}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

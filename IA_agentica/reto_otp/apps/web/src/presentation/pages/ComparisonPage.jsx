import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, GitCompare } from 'lucide-react'
import ComparisonTable from '../components/ComparisonTable'
import DownloadButtons from '../components/DownloadButtons'
import EmptyState from '../components/EmptyState'
import ProsConsMatrix from '../components/ProsConsMatrix'
import StatusBadge from '../components/StatusBadge'
import TcoChart from '../components/TcoChart'
import { useEvaluationDetails } from '../hooks/useEvaluation'
import { summaryText } from '../lib/formatters'
import { useEvaluationStore } from '../store/evaluation'
import { useSessionStore } from '../store/session'

export default function ComparisonPage() {
  const navigate = useNavigate()
  const evaluations = useSessionStore((state) => state.evaluations)
  const projects = useSessionStore((state) => state.projects)
  const activeProjectId = useSessionStore((state) => state.activeProjectId)
  const activeEvaluationId = useEvaluationStore((state) => state.activeEvaluationId)
  const setActiveEvaluationId = useEvaluationStore((state) => state.setActiveEvaluationId)
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null
  const projectEvaluations = evaluations.filter((evaluation) => !activeProject || evaluation.projectId === activeProject.id)
  const latestEvaluation = projectEvaluations[0] ?? evaluations[0] ?? null
  const details = useEvaluationDetails(activeEvaluationId)
  const evaluation = details.evaluation
  const rows = Array.isArray(evaluation?.comparison) ? evaluation.comparison : []
  const recommendedId = evaluation?.recommendedId

  useEffect(() => {
    if (!activeEvaluationId && latestEvaluation?.id) setActiveEvaluationId(latestEvaluation.id)
  }, [activeEvaluationId, latestEvaluation?.id, setActiveEvaluationId])

  if (!evaluation) {
    return (
      <EmptyState
        icon={GitCompare}
        title="Sin comparativa disponible"
        description="Ejecuta una evaluación para generar la tabla comparativa con costos ocultos, TCO y decisiones."
        actionLabel="Ir a evaluación"
        onAction={() => navigate('/evaluacion')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orion-yellow">Auditoría financiera</p>
          <h2 className="mt-1 text-2xl font-bold text-orion-text">Comparativa de propuestas</h2>
          <p className="mt-1 text-sm text-slate-300">{activeProject?.name ?? 'Evaluación activa'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={evaluation.status} />
          <button type="button" className="orion-button orion-button-secondary" onClick={() => navigate('/reportes')}>
            Ver informe
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {summaryText(evaluation.summary) ? (
        <section className="orion-card p-5">
          <h3 className="mb-2 text-sm font-semibold text-orion-text">Resumen del dictamen</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{summaryText(evaluation.summary)}</p>
        </section>
      ) : null}

      {rows.length ? (
        <>
          <section className="orion-card space-y-4 p-5">
            <div>
              <h3 className="text-sm font-semibold text-orion-text">Costo total de propiedad</h3>
              <p className="text-xs text-slate-400">La barra amarilla identifica la propuesta recomendada.</p>
            </div>
            <TcoChart rows={rows} recommendedId={recommendedId} />
          </section>

          <section className="orion-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-orion-text">Tabla comparativa</h3>
            <ComparisonTable rows={rows} recommendedId={recommendedId} />
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-orion-text">Matriz pros / contras</h3>
              <p className="text-xs text-slate-400">Fortalezas y riesgos por propuesta.</p>
            </div>
            <ProsConsMatrix rows={rows} recommendedId={recommendedId} />
          </section>
        </>
      ) : (
        <EmptyState
          icon={GitCompare}
          title="La evaluación aún no tiene comparativa"
          description="Cuando el agente termine de auditar las propuestas, la tabla y las gráficas aparecerán aquí."
        />
      )}

      <section className="orion-card space-y-3 p-5">
        <div>
          <h3 className="text-sm font-semibold text-orion-text">Exportaciones</h3>
          <p className="text-xs text-slate-400">Descarga el informe ejecutivo y la tabla comparativa.</p>
        </div>
        <DownloadButtons evaluationId={evaluation.id} />
      </section>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { ArrowRight, FileText } from 'lucide-react'
import DownloadButtons from '../components/DownloadButtons'
import EmptyState from '../components/EmptyState'
import ReviewActions from '../components/ReviewActions'
import { LoadingBlock } from '../components/Skeleton'
import Stepper from '../components/Stepper'
import StatusBadge from '../components/StatusBadge'
import Verdict from '../components/Verdict'
import { useEvaluationDetails } from '../hooks/useEvaluation'
import { useRates } from '../hooks/useRates'
import { formatDate, formatUsd, summaryText } from '../lib/formatters'
import { useEvaluationStore } from '../store/evaluation'
import { useSessionStore } from '../store/session'

export default function ReportsPage() {
  const navigate = useNavigate()
  const evaluations = useSessionStore((state) => state.evaluations)
  const projects = useSessionStore((state) => state.projects)
  const activeProjectId = useSessionStore((state) => state.activeProjectId)
  const activeEvaluationId = useEvaluationStore((state) => state.activeEvaluationId)
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null
  const evaluationId = activeEvaluationId ?? evaluations.find((evaluation) => !activeProject || evaluation.projectId === activeProject.id)?.id ?? null
  const details = useEvaluationDetails(evaluationId)
  const { rates } = useRates()
  const evaluation = details.evaluation

  if (!evaluation && details.isLoading) {
    return <LoadingBlock label="Cargando informe…" lines={5} />
  }

  if (!evaluation) {
    return (
      <EmptyState
        icon={FileText}
        title="Aún no hay informe"
        description="Una vez que la evaluación finalice, aquí encontrarás el resumen ejecutivo y las exportaciones."
        actionLabel="Ir a evaluación"
        onAction={() => navigate('/evaluacion')}
      />
    )
  }

  const effectiveRate = evaluation.exchangeRate ?? rates?.rateUsd
  const effectiveRateDate = evaluation.exchangeRateDate ?? rates?.effectiveDate

  return (
    <div className="space-y-6">
      <Stepper current="/reportes" />

      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orion-yellow">Informe ejecutivo</p>
          <h2 className="mt-1 text-2xl font-bold text-orion-text">Reporte de adjudicación</h2>
          <p className="mt-1 text-sm text-slate-300">{activeProject?.name ?? 'Evaluación activa'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={evaluation.status} />
          <button type="button" className="orion-button orion-button-secondary" onClick={() => navigate('/comparativa')}>
            Ver comparativa
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <section className="orion-card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-orion-text">Resumen ejecutivo</h3>
          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <span>Tasa BCV: <strong className="text-orion-yellow">{effectiveRate ? formatUsd(effectiveRate) : '—'}</strong></span>
            <span>Fecha valor: <strong className="text-orion-text">{effectiveRateDate ?? '—'}</strong></span>
            <span>Finalizado: <strong className="text-orion-text">{formatDate(evaluation.finishedAt)}</strong></span>
          </div>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
          {summaryText(evaluation.summary) || 'El informe ejecutivo estará disponible cuando la corrida termine.'}
        </p>
        {evaluation.approver || evaluation.approvedBy ? (
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            Aprobado por {evaluation.approver ?? evaluation.approvedBy}
          </div>
        ) : null}
      </section>

      <Verdict evaluation={evaluation} analyses={details.analyses} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
        <section className="orion-card space-y-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-orion-text">Descargas</h3>
            <p className="text-xs text-slate-400">Informe PDF y tabla comparativa en CSV o XLSX.</p>
          </div>
          <DownloadButtons evaluationId={evaluation.id} />
        </section>
        <ReviewActions evaluation={evaluation} />
      </div>
    </div>
  )
}

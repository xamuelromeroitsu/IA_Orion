import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowRight, FileText, Play } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import { LoadingBlock } from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import Stepper from '../components/Stepper'
import { useToast } from '../hooks/useToast'
import TracePanel from '../components/TracePanel'
import Verdict from '../components/Verdict'
import { useDocuments } from '../hooks/useDocuments'
import { useEvaluation, useEvaluationDetails } from '../hooks/useEvaluation'
import { useTraceStream } from '../hooks/useTraceStream'
import { canRole, computeProgress } from '../lib/constants'
import { formatDate } from '../lib/formatters'
import { useEvaluationStore } from '../store/evaluation'
import { useSessionStore } from '../store/session'

export default function EvaluationPage() {
  const navigate = useNavigate()
  const projects = useSessionStore((state) => state.projects)
  const evaluations = useSessionStore((state) => state.evaluations)
  const activeProjectId = useSessionStore((state) => state.activeProjectId)
  const role = useSessionStore((state) => state.role)
  const activeEvaluationId = useEvaluationStore((state) => state.activeEvaluationId)
  const setActiveEvaluationId = useEvaluationStore((state) => state.setActiveEvaluationId)
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null
  const currentProjectId = activeProject?.id ?? activeProjectId
  const projectEvaluations = evaluations.filter((evaluation) => evaluation.projectId === currentProjectId)
  const latestEvaluation = projectEvaluations[0] ?? null
  const { documents } = useDocuments(currentProjectId)
  const { startEvaluation, isStarting, error: startError } = useEvaluation()
  const details = useEvaluationDetails(activeEvaluationId, { poll: true, stopWhenComplete: true })
  const stream = useTraceStream(activeEvaluationId, { enabled: Boolean(activeEvaluationId), isComplete: details.isComplete })
  const toast = useToast()
  const notifiedRef = useRef(false)
  const canEvaluate = canRole(role, 'evaluate')
  const progress = computeProgress(stream.events, details.isComplete)

  useEffect(() => {
    if (!activeEvaluationId && latestEvaluation?.id) setActiveEvaluationId(latestEvaluation.id)
  }, [activeEvaluationId, latestEvaluation?.id, setActiveEvaluationId])

  useEffect(() => {
    if (!activeEvaluationId) {
      notifiedRef.current = false
      return
    }
    if (details.isComplete && !notifiedRef.current) {
      notifiedRef.current = true
      toast.success('Evaluación completada')
    }
  }, [activeEvaluationId, details.isComplete, toast])

  const handleStart = async () => {
    try {
      await startEvaluation(currentProjectId)
      toast.info('Evaluación iniciada')
    } catch (caught) {
      toast.error(caught?.message ?? 'No se pudo iniciar la evaluación')
    }
  }

  if (!activeProject) {
    return (
      <EmptyState
        icon={Activity}
        title="No hay proyecto para evaluar"
        description="Crea un proyecto y carga sus propuestas antes de iniciar una corrida de evaluación."
        actionLabel="Ir al panel"
        onAction={() => navigate('/')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Stepper current="/evaluacion" />

      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orion-yellow">Motor de dictamen</p>
          <h2 className="mt-1 text-2xl font-bold text-orion-text">Evaluación de propuestas</h2>
          <p className="mt-1 text-sm text-slate-300">{activeProject.name}</p>
        </div>
        <button
          type="button"
          className="orion-button orion-button-yellow"
          disabled={!canEvaluate || isStarting || !documents.length}
          onClick={handleStart}
        >
          {isStarting ? <Activity size={16} className="animate-pulse" /> : <Play size={16} />}
          {isStarting ? 'Iniciando…' : 'Evaluar propuestas'}
        </button>
      </section>

      {!canEvaluate ? (
        <div className="rounded-xl border border-orion-yellow/25 bg-orion-yellow/10 px-4 py-3 text-xs text-orion-yellow">
          Cambia a «Cargador» en el selector de rol para iniciar una evaluación.
        </div>
      ) : null}

      {!documents.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
          <span className="flex items-center gap-2"><FileText size={15} /> Sube al menos un documento antes de evaluar.</span>
          <button type="button" className="orion-button orion-button-secondary px-3 py-1.5 text-xs" onClick={() => navigate('/documentos')}>
            Ir a documentos
          </button>
        </div>
      ) : null}

      {startError ? <p className="text-xs text-red-300">{startError.message}</p> : null}

      {activeEvaluationId && details.evaluation ? (
        <section className="orion-card space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Corrida activa</p>
              <p className="font-mono text-sm text-orion-text">{details.evaluation.id}</p>
              <p className="mt-1 text-xs text-slate-400">Iniciada {formatDate(details.evaluation.startedAt)}</p>
            </div>
            <StatusBadge status={details.evaluation.status} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Progreso derivado de eventos</span>
              <span className="font-semibold text-orion-yellow">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-orion-blue to-orion-yellow transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>
      ) : null}

      {activeEvaluationId && details.isLoading && !details.evaluation ? <LoadingBlock label="Cargando evaluación…" lines={4} /> : null}

      {activeEvaluationId ? <TracePanel events={stream.events} isStreaming={stream.isStreaming} /> : null}

      {details.isComplete && details.evaluation ? (
        <div className="space-y-5">
          <Verdict evaluation={details.evaluation} analyses={details.analyses} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="orion-button orion-button-primary" onClick={() => navigate('/comparativa')}>
              Ver comparativa
              <ArrowRight size={15} />
            </button>
            <button type="button" className="orion-button orion-button-secondary" onClick={() => navigate('/reportes')}>
              Abrir informe
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

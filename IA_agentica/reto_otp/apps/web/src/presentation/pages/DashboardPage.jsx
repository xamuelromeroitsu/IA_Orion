import { useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Analytics01Icon, Coins01Icon, File02Icon } from '@hugeicons/core-free-icons'
import { ArrowRight, FolderOpen, TrendingUp } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import MagicBento from '../components/MagicBento'
import ProjectForm from '../components/ProjectForm'
import StatusBadge from '../components/StatusBadge'
import Stepper from '../components/Stepper'
import TcoChart from '../components/TcoChart'
import { useDocuments } from '../hooks/useDocuments'
import { useRates } from '../hooks/useRates'
import { statusLabel } from '../lib/constants'
import { formatDate, formatUsd, severityClasses, summaryText, toNumber } from '../lib/formatters'
import { useSessionStore } from '../store/session'

export default function DashboardPage() {
  const navigate = useNavigate()
  const projects = useSessionStore((state) => state.projects)
  const evaluations = useSessionStore((state) => state.evaluations)
  const activeProjectId = useSessionStore((state) => state.activeProjectId)
  const setActiveProjectId = useSessionStore((state) => state.setActiveProjectId)
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null
  const currentProjectId = activeProject?.id ?? activeProjectId
  const { documents, analyses } = useDocuments(currentProjectId)
  const { rates } = useRates()

  const projectEvaluations = evaluations.filter((evaluation) => evaluation.projectId === currentProjectId)
  const latestEvaluation = projectEvaluations[0] ?? null
  const comparisonRows = Array.isArray(latestEvaluation?.comparison) ? latestEvaluation.comparison : []
  const fallbackRows = analyses.map((analysis) => ({
    analysisId: analysis.id,
    supplier: analysis.supplier,
    fileName: documents.find((document) => document.id === analysis.documentId)?.fileName,
    declaredTotal: analysis.declaredTotal,
    tcoUsd: analysis.tcoUsd
  }))
  const chartRows = comparisonRows.length ? comparisonRows : fallbackRows
  const findings = analyses.flatMap((analysis) => (Array.isArray(analysis.findings) ? analysis.findings : []))
  const criticalCount = findings.filter((finding) => ['critical', 'high'].includes(String(finding?.severity ?? '').toLowerCase())).length
  const tcoValues = chartRows.map((row) => toNumber(row.tcoUsd))
  const detectedSavings = tcoValues.length > 1 ? Math.max(...tcoValues) - Math.min(...tcoValues) : 0
  const metricItems = [
    {
      id: 'documents',
      to: '/documentos',
      label: 'Documentos',
      title: documents.length,
      description: 'Archivos del proyecto activo',
      icon: <HugeiconsIcon icon={File02Icon} size={19} strokeWidth={1.8} />
    },
    {
      id: 'analyses',
      to: '/evaluacion',
      label: 'Análisis',
      title: analyses.length,
      description: 'Propuestas extraídas',
      icon: <HugeiconsIcon icon={Analytics01Icon} size={19} strokeWidth={1.8} />
    },
    {
      id: 'savings',
      to: '/comparativa',
      label: 'Ahorro detectado',
      title: formatUsd(detectedSavings),
      description: 'Diferencia entre TCO extremos',
      icon: <HugeiconsIcon icon={Coins01Icon} size={19} strokeWidth={1.8} />
    },
    {
      id: 'findings',
      to: '/reportes',
      label: 'Hallazgos críticos',
      title: criticalCount,
      description: 'Requieren revisión humana',
      icon: <HugeiconsIcon icon={Alert02Icon} size={19} strokeWidth={1.8} />
    }
  ]
  const activities = [
    ...projectEvaluations.map((evaluation) => ({
      id: evaluation.id,
      title: `Evaluación ${statusLabel(evaluation.status)}`,
      detail: formatDate(evaluation.startedAt ?? evaluation.finishedAt),
      tone: ''
    })),
    ...findings.slice(-6).map((finding) => ({
      id: finding.id ?? `${finding.title}-${finding.category}`,
      title: summaryText(finding.title) || 'Hallazgo registrado',
      detail: `${finding.category ?? 'general'} · ${formatUsd(finding.amountImpactUsd)}`,
      tone: severityClasses(finding.severity)
    }))
  ].slice(0, 6)

  const focusProjectForm = () => {
    document.getElementById('project-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="space-y-6">
      <Stepper current="/" />

      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orion-yellow">Centro de mando</p>
          <h2 className="mt-1 text-2xl font-bold text-orion-text">Panel de evaluación de propuestas</h2>
          <p className="mt-1 text-sm text-slate-300">Auditoría financiera, trazabilidad y dictamen en un solo lugar.</p>
        </div>
        {rates?.rateUsd ? (
          <div className="rounded-xl border border-orion-yellow/20 bg-orion-yellow/10 px-4 py-2 text-xs">
            <span className="text-slate-300">Tasa BCV </span>
            <span className="font-semibold text-orion-yellow">{formatUsd(rates.rateUsd)}</span>
            <span className="ml-2 text-slate-400">{rates.effectiveDate ?? ''}</span>
          </div>
        ) : null}
      </section>

      <MagicBento
        className="orion-metrics-bento"
        items={metricItems}
        columns={4}
        rowHeight={148}
        gap={16}
        radius={18}
        theme="dark"
        glowColor="#FACC15"
        enableStars={false}
        enableTilt={false}
        enableMagnetism={false}
        onItemClick={(item) => navigate(item.to)}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          {projects.length > 1 ? (
            <div className="orion-card flex flex-wrap items-center gap-3 p-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="active-project">Proyecto activo</label>
              <select
                id="active-project"
                className="orion-input max-w-sm flex-1"
                value={currentProjectId ?? ''}
                onChange={(event) => setActiveProjectId(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          {activeProject ? (
            <article className="orion-card space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orion-blue/15 text-sky-300">
                    <FolderOpen size={21} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-orion-text">{activeProject.name}</h3>
                    <p className="text-xs text-slate-400">
                      {activeProject.location || 'Sin ubicación'} · Actualizado {formatDate(activeProject.updatedAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={activeProject.status} />
              </div>

              {summaryText(activeProject.description) ? (
                <p className="text-sm leading-relaxed text-slate-300">{summaryText(activeProject.description)}</p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-orion-background/50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Presupuesto disponible</p>
                  <p className="mt-1 text-sm font-semibold text-orion-yellow">{formatUsd(activeProject.budgetReferenceUsd)}</p>
                </div>
                <div className="rounded-xl bg-orion-background/50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Documentos</p>
                  <p className="mt-1 text-sm font-semibold text-orion-text">{documents.length}</p>
                </div>
                <div className="rounded-xl bg-orion-background/50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Evaluaciones</p>
                  <p className="mt-1 text-sm font-semibold text-orion-text">{projectEvaluations.length}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="orion-button orion-button-primary" onClick={() => navigate('/documentos')}>
                  Ver documentos
                  <ArrowRight size={15} />
                </button>
                <button type="button" className="orion-button orion-button-secondary" onClick={() => navigate('/evaluacion')}>
                  Evaluar propuestas
                </button>
              </div>
            </article>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="Empieza con un proyecto"
              description="Crea un proyecto, carga las propuestas de los proveedores y deja que ORION calcule el costo total real."
              actionLabel="Ir al formulario"
              onAction={focusProjectForm}
            />
          )}

          <section className="orion-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={17} className="text-orion-yellow" />
              <div>
                <h3 className="text-sm font-semibold text-orion-text">TCO por proveedor</h3>
                <p className="text-xs text-slate-400">Comparativa del costo total en USD</p>
              </div>
            </div>
            {chartRows.length ? (
              <TcoChart rows={chartRows} recommendedId={latestEvaluation?.recommendedId} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Aún no hay costos calculados para mostrar.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <ProjectForm onCreated={() => navigate('/documentos')} />

          <section className="orion-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-orion-text">Actividad reciente</h3>
            {activities.length ? (
              <ul className="space-y-2">
                {activities.map((activity) => (
                  <li key={activity.id} className={`rounded-xl border border-white/5 bg-orion-background/40 px-3 py-2.5 ${activity.tone}`}>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="mt-0.5 text-[11px] opacity-75">{activity.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Las evaluaciones y los hallazgos aparecerán aquí.</p>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

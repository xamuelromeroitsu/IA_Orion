import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, FileText } from 'lucide-react'
import AnalysisCard from '../components/AnalysisCard'
import DocumentList from '../components/DocumentList'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import Uploader from '../components/Uploader'
import { useDocuments } from '../hooks/useDocuments'
import { canRole } from '../lib/constants'
import { formatDate, summaryText } from '../lib/formatters'
import { useSessionStore } from '../store/session'

export default function DocumentsPage() {
  const navigate = useNavigate()
  const role = useSessionStore((state) => state.role)
  const projects = useSessionStore((state) => state.projects)
  const activeProjectId = useSessionStore((state) => state.activeProjectId)
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null
  const { documents, analyses, isLoading, isUploading, upload, error, uploadError } = useDocuments(activeProject?.id ?? activeProjectId)
  const canUpload = canRole(role, 'upload')

  if (!activeProject) {
    return (
      <EmptyState
        icon={FileText}
        title="Aún no hay un proyecto activo"
        description="Crea un proyecto en el panel principal para poder cargar documentos y propuestas."
        actionLabel="Ir al panel"
        onAction={() => navigate('/')}
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orion-yellow">Ingesta multimodal</p>
          <h2 className="mt-1 text-2xl font-bold text-orion-text">Documentos del proyecto</h2>
          <p className="mt-1 text-sm text-slate-300">{activeProject.name} · {formatDate(activeProject.updatedAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={activeProject.status} />
          <button type="button" className="orion-button orion-button-secondary" onClick={() => navigate('/evaluacion')}>
            Ir a evaluación
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {!canUpload ? (
        <div className="flex items-center gap-2 rounded-xl border border-orion-yellow/25 bg-orion-yellow/10 px-4 py-3 text-xs text-orion-yellow">
          <AlertTriangle size={15} />
          Tu rol actual no permite cargar archivos. Cambia a «Cargador» en el selector de rol.
        </div>
      ) : null}

      <section className="orion-card space-y-5 p-5">
        <div>
          <h3 className="text-sm font-semibold text-orion-text">Cargar propuestas</h3>
          <p className="text-xs text-slate-400">Se aceptan entre 1 y 20 archivos PDF, JPG, PNG o XLSX.</p>
        </div>
        {uploadError ? <p className="text-xs text-red-300">{uploadError.message}</p> : null}
        <Uploader onUpload={upload} isUploading={isUploading} disabled={!canUpload} />
      </section>

      <section className="orion-card space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-orion-text">Archivos cargados</h3>
            <p className="text-xs text-slate-400">{isLoading ? 'Cargando…' : `${documents.length} documento(s)`}</p>
          </div>
          {error ? <p className="text-xs text-red-300">{error.message}</p> : null}
        </div>
        <DocumentList documents={documents} analyses={analyses} />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-orion-text">Análisis por documento</h3>
          <p className="text-xs text-slate-400">{analyses.length} análisis disponibles</p>
        </div>
        {analyses.length ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {analyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                analysis={analysis}
                document={documents.find((document) => document.id === analysis.documentId)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Sin análisis todavía"
            description={summaryText(activeProject.description) || 'Sube las propuestas para que el agente extraiga, recalcule y audite cada documento.'}
          />
        )}
      </section>
    </div>
  )
}

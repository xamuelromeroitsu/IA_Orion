import { ExternalLink, FileSpreadsheet, FileText, Image as ImageIcon } from 'lucide-react'
import { buildFileUrl } from '../lib/api'
import { formatBytes, formatDate } from '../lib/formatters'
import StatusBadge from './StatusBadge'

function documentIcon(documentRecord) {
  const mime = documentRecord?.mime ?? ''
  if (mime.includes('spreadsheet')) return FileSpreadsheet
  if (mime.includes('image')) return ImageIcon
  return FileText
}

export default function DocumentList({ documents = [], analyses = [] }) {
  if (!documents.length) {
    return <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">Todavía no hay documentos cargados.</p>
  }

  return (
    <ul className="divide-y divide-white/5">
      {documents.map((documentRecord) => {
        const Icon = documentIcon(documentRecord)
        const analysis = analyses.find((item) => item.documentId === documentRecord.id)
        return (
          <li key={documentRecord.id} className="flex flex-wrap items-center gap-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orion-blue/15 text-sky-300">
              <Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-orion-text">{documentRecord.fileName}</p>
              <p className="text-xs text-slate-400">
                {documentRecord.kind || 'documento'} · {formatBytes(documentRecord.size)} · {formatDate(documentRecord.uploadedAt)}
              </p>
            </div>
            <StatusBadge status={analysis ? 'completed' : 'pending'} label={analysis ? 'Analizado' : 'Pendiente'} />
            <a
              href={buildFileUrl(documentRecord.id)}
              target="_blank"
              rel="noreferrer"
              className="orion-button orion-button-secondary px-3 py-1.5 text-xs"
            >
              Ver archivo
              <ExternalLink size={13} />
            </a>
          </li>
        )
      })}
    </ul>
  )
}

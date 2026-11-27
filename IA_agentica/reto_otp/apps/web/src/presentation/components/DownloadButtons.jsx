import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { downloadFile, normalizeApiError } from '../lib/api'

const downloadOptions = [
  { key: 'pdf', label: 'Informe PDF', icon: FileText, path: (id) => `/api/evaluations/${id}/report.pdf`, fileName: 'orion-informe.pdf' },
  { key: 'csv', label: 'Comparativa CSV', icon: FileSpreadsheet, path: (id) => `/api/evaluations/${id}/comparison.csv`, fileName: 'orion-comparativa.csv' },
  { key: 'xlsx', label: 'Comparativa XLSX', icon: FileSpreadsheet, path: (id) => `/api/evaluations/${id}/comparison.xlsx`, fileName: 'orion-comparativa.xlsx' }
]

export default function DownloadButtons({ evaluationId }) {
  const [downloadingKey, setDownloadingKey] = useState('')
  const [error, setError] = useState(null)

  const handleDownload = async (option) => {
    if (!evaluationId) return
    setDownloadingKey(option.key)
    setError(null)
    try {
      await downloadFile(option.path(evaluationId), option.fileName)
    } catch (caught) {
      setError(normalizeApiError(caught).message)
    } finally {
      setDownloadingKey('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {downloadOptions.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.key}
              type="button"
              className="orion-button orion-button-secondary"
              disabled={!evaluationId || Boolean(downloadingKey)}
              onClick={() => handleDownload(option)}
            >
              {downloadingKey === option.key ? <Download size={16} className="animate-pulse" /> : <Icon size={16} />}
              {option.label}
            </button>
          )
        })}
      </div>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  )
}

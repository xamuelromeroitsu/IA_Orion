import { useRef, useState } from 'react'
import { Camera, FileSpreadsheet, FileText, Image as ImageIcon, UploadCloud, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { formatBytes } from '../lib/formatters'

const maxFileSize = 20 * 1024 * 1024

const acceptedTypes = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
}

function fileIcon(file) {
  const mime = file?.type ?? ''
  if (mime.includes('spreadsheet')) return FileSpreadsheet
  if (mime.includes('image')) return ImageIcon
  return FileText
}

export default function Uploader({ onUpload, isUploading = false, disabled = false, maxFiles = 20 }) {
  const [files, setFiles] = useState([])
  const [validationMessage, setValidationMessage] = useState('')
  const cameraInputRef = useRef(null)

  const onDrop = (acceptedFiles, rejectedFiles) => {
    setValidationMessage('')
    if (rejectedFiles.length) {
      setValidationMessage(`${rejectedFiles.length} archivo(s) rechazado(s). Usa PDF, JPG, PNG o XLSX de hasta 20 MB.`)
    }
    setFiles((current) => {
      const merged = [...current, ...acceptedFiles]
      const unique = merged.filter(
        (file, index) => merged.findIndex((item) => item.name === file.name && item.size === file.size) === index
      )
      return unique.slice(0, maxFiles)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxFiles,
    maxSize: maxFileSize,
    multiple: true,
    disabled: disabled || isUploading
  })

  const handleCameraChange = (event) => {
    const capturedFiles = Array.from(event.target.files ?? [])
    if (capturedFiles.length) onDrop(capturedFiles, [])
    event.target.value = ''
  }

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
  }

  const handleUpload = async () => {
    if (!files.length) {
      setValidationMessage('Selecciona al menos un archivo')
      return
    }
    try {
      await onUpload(files)
      setFiles([])
      setValidationMessage('')
    } catch (caught) {
      setValidationMessage(caught?.message ?? 'No se pudieron subir los archivos')
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-5 py-9 text-center transition ${
          isDragActive ? 'border-orion-yellow bg-orion-yellow/10' : 'border-white/15 bg-orion-background/40 hover:border-orion-blue/60'
        } ${disabled || isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orion-blue/15 text-sky-300">
          <UploadCloud size={24} />
        </span>
        <div>
          <p className="text-sm font-semibold text-orion-text">Arrastra aquí las propuestas</p>
          <p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG o XLSX · hasta 20 archivos de 20 MB</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="orion-button orion-button-secondary" disabled={disabled || isUploading} onClick={() => cameraInputRef.current?.click()}>
          <Camera size={16} />
          Escanear con cámara
        </button>
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCameraChange} />
        <button type="button" className="orion-button orion-button-primary" disabled={disabled || isUploading || !files.length} onClick={handleUpload}>
          {isUploading ? 'Subiendo…' : `Subir ${files.length || ''} archivo(s)`}
        </button>
      </div>

      {validationMessage ? <p className="text-xs text-orion-yellow">{validationMessage}</p> : null}

      {files.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {files.map((file, index) => {
            const Icon = fileIcon(file)
            return (
              <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-orion-background/50 px-3 py-2">
                <Icon size={17} className="shrink-0 text-sky-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-orion-text">{file.name}</p>
                  <p className="text-[11px] text-slate-400">{formatBytes(file.size)}</p>
                </div>
                <button type="button" aria-label={`Quitar ${file.name}`} className="text-slate-400 transition hover:text-red-300" onClick={() => removeFile(index)}>
                  <X size={16} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

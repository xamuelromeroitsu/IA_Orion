import { useMemo, useRef, useState } from 'react'
import { Camera, UploadCloud, X } from 'lucide-react'
import { HugeiconsIcon } from '@hugeicons/react'
import { File01Icon, Image01Icon, Pdf01Icon, Table01Icon } from '@hugeicons/core-free-icons'
import { useDropzone } from 'react-dropzone'
import AnimatedList from './AnimatedList'
import { formatBytes } from '../lib/formatters'
import { useToast } from '../hooks/useToast'

const maxFileSize = 20 * 1024 * 1024

const acceptedTypes = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
}

const fileIcons = {
  pdf: Pdf01Icon,
  spreadsheet: Table01Icon,
  image: Image01Icon,
  file: File01Icon
}

// Los MIME pueden venir vacíos en el navegador, así que el nombre también decide el icono.
function fileKind(file) {
  const mime = file?.type ?? ''
  const name = file?.name ?? ''
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf'
  if (mime.includes('spreadsheet') || /\.(xlsx|xls|csv)$/i.test(name)) return 'spreadsheet'
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name)) return 'image'
  return 'file'
}

function fileIcon(file) {
  return <HugeiconsIcon icon={fileIcons[fileKind(file)]} size={18} strokeWidth={1.8} />
}

function fileLabel(file) {
  const kind = fileKind(file)
  if (kind === 'spreadsheet') return 'XLSX'
  if (kind === 'image') return file.name?.split('.').pop()?.toUpperCase() ?? 'IMG'
  return kind.toUpperCase()
}

export default function Uploader({ onUpload, isUploading = false, disabled = false, maxFiles = 20 }) {
  const [files, setFiles] = useState([])
  const [validationMessage, setValidationMessage] = useState('')
  const cameraInputRef = useRef(null)
  const toast = useToast()

  // id estable: al quitar un archivo, los demás conservan su fila y solo entra animada la nueva.
  const animatedItems = useMemo(
    () => files.map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}`, file })),
    [files]
  )

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
      toast.error('Selecciona al menos un archivo')
      return
    }
    try {
      await onUpload(files)
      toast.success(`${files.length} archivo(s) subidos correctamente`)
      setFiles([])
      setValidationMessage('')
    } catch (caught) {
      const message = caught?.message ?? 'No se pudieron subir los archivos'
      setValidationMessage(message)
      toast.error(message)
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

      {animatedItems.length ? (
        <AnimatedList
          className="upload-animated-list"
          items={animatedItems}
          renderItem={(item, index) => {
            const kind = fileKind(item.file)
            return (
              <div className="upload-file-row">
                <span className={`upload-file-kind upload-file-kind--${kind}`}>
                  {fileIcon(item.file)}
                </span>
                <span className="upload-file-text">
                  <span className="upload-file-name" title={item.file.name}>{item.file.name}</span>
                  <span className="upload-file-size">{formatBytes(item.file.size)} · {fileLabel(item.file)}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Quitar ${item.file.name}`}
                  className="upload-file-remove"
                  onClick={(event) => {
                    // Evita que el clic del botón también seleccione la fila dentro de AnimatedList.
                    event.stopPropagation()
                    removeFile(index)
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )
          }}
          animation="pop"
          animateOnce
          stagger={0.055}
          theme="dark"
          accentColor="#FACC15"
          frame={false}
          showGradients={files.length > 6}
          displayScrollbar={files.length > 6}
          width="100%"
          maxHeight={280}
          radius={12}
          gap={8}
        />
      ) : null}
    </div>
  )
}

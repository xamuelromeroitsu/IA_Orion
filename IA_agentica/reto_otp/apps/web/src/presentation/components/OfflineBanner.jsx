import { RotateCcw, WifiOff } from 'lucide-react'

export default function OfflineBanner({ visible, onRetry }) {
  if (!visible) return null

  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-orion-yellow/25 bg-orion-yellow/10 px-4 py-2 text-xs text-orion-yellow lg:px-8">
      <span className="flex items-center gap-2">
        <WifiOff size={14} />
        Sin conexión con la API. Revisa tu conexión e inténtalo de nuevo.
      </span>
      <button type="button" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold transition hover:bg-orion-yellow/10" onClick={onRetry}>
        <RotateCcw size={13} />
        Reintentar
      </button>
    </div>
  )
}

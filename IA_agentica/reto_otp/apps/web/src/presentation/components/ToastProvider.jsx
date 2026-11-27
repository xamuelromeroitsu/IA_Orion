import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { ToastContext } from './ToastContext'

const DURATION = 4200
let nextId = 0

const tones = {
  success: { icon: CheckCircle2, className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100', role: 'status' },
  error: { icon: CircleAlert, className: 'border-red-400/30 bg-red-500/10 text-red-100', role: 'alert' },
  info: { icon: Info, className: 'border-sky-400/30 bg-sky-500/10 text-sky-100', role: 'status' }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const show = useCallback(
    (message, tone = 'success') => {
      const id = ++nextId
      // Cola corta: como máximo tres avisos para no tapar la interfaz.
      setToasts((current) => [...current.slice(-2), { id, message, tone }])
      timers.current.set(id, window.setTimeout(() => dismiss(id), DURATION))
    },
    [dismiss]
  )

  useEffect(() => {
    const active = timers.current
    return () => active.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const value = useMemo(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info')
    }),
    [show]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => {
          const tone = tones[toast.tone] ?? tones.success
          const Icon = tone.icon
          return (
            <div key={toast.id} role={tone.role} className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-card backdrop-blur ${tone.className}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 leading-relaxed">{toast.message}</p>
              <button type="button" aria-label="Cerrar aviso" className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition hover:bg-white/10" onClick={() => dismiss(toast.id)}>
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

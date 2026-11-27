import { statusLabel, statusTone } from '../lib/constants'

const toneClasses = {
  success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-orion-yellow/30 bg-orion-yellow/10 text-orion-yellow',
  danger: 'border-red-400/30 bg-red-500/10 text-red-200',
  info: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  neutral: 'border-white/15 bg-white/5 text-slate-300'
}

const dotClasses = {
  success: 'bg-emerald-300',
  warning: 'bg-orion-yellow',
  danger: 'bg-red-300',
  info: 'bg-sky-300',
  neutral: 'bg-slate-400'
}

export default function StatusBadge({ status, label, tone, className = '' }) {
  const resolvedTone = tone ?? statusTone(status)
  const resolvedLabel = label ?? statusLabel(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses[resolvedTone]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[resolvedTone]}`} />
      {resolvedLabel}
    </span>
  )
}

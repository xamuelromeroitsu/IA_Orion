const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const decimalFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatUsd(value) {
  return usdFormatter.format(toNumber(value))
}

export function formatVes(value, rate = 1) {
  return `Bs. ${decimalFormatter.format(toNumber(value) * toNumber(rate))}`
}

export function formatCurrencyValue(value, currency = 'USD', rate = 1) {
  const code = String(currency || 'USD').toUpperCase()
  if (code === 'USD') return formatUsd(value)
  if (code === 'VES') return formatVes(value, rate)
  return `${code} ${decimalFormatter.format(toNumber(value))}`
}

export function formatPercent(value, digits = 1) {
  return `${toNumber(value).toFixed(digits)}%`
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function formatTime(value) {
  if (!value) return '--:--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--:--'
  return new Intl.DateTimeFormat('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
}

export function formatBytes(value) {
  const bytes = toNumber(value)
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function getInitials(name) {
  const initials = String(name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
  return initials || 'OR'
}

export function toTextList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item
        return item?.text ?? item?.detail ?? item?.title ?? item?.description ?? ''
      })
      .filter(Boolean)
  }
  if (value && typeof value === 'object') {
    return Object.values(value)
      .map((item) => (typeof item === 'string' ? item : item?.text ?? ''))
      .filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) return [value]
  return []
}

export function summaryText(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    return value.text ?? value.executive ?? value.recommendation ?? value.conclusion ?? JSON.stringify(value)
  }
  return String(value)
}

export function evidenceText(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(evidenceText).filter(Boolean).join(' · ')
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${evidenceText(item)}`)
      .filter(Boolean)
      .join(' · ')
  }
  return ''
}

const severityStyles = {
  critical: 'border-red-400/40 bg-red-500/10 text-red-200',
  high: 'border-orange-400/40 bg-orange-500/10 text-orange-200',
  medium: 'border-orion-yellow/40 bg-orion-yellow/10 text-orion-yellow',
  low: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  info: 'border-white/15 bg-white/5 text-slate-300'
}

export function severityClasses(severity) {
  return severityStyles[String(severity ?? '').toLowerCase()] ?? severityStyles.info
}

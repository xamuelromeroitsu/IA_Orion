export const roles = [
  { id: 'cargador', label: 'Cargador', description: 'Crea proyectos y carga propuestas' },
  { id: 'revisor', label: 'Revisor', description: 'Revisa el dictamen' },
  { id: 'aprobador', label: 'Aprobador', description: 'Aprueba la adjudicación' },
  { id: 'auditor', label: 'Auditor', description: 'Acceso de solo lectura' }
]

export const rolePermissions = {
  cargador: { upload: true, evaluate: true, review: false, approve: false },
  revisor: { upload: false, evaluate: false, review: true, approve: false },
  aprobador: { upload: false, evaluate: false, review: false, approve: true },
  auditor: { upload: false, evaluate: false, review: false, approve: false }
}

export function canRole(role, action) {
  return Boolean(rolePermissions[role]?.[action])
}

const statusLabels = {
  draft: 'Borrador',
  received: 'Recibido',
  uploading: 'Cargando',
  processing: 'Procesando',
  evaluating: 'Evaluando',
  running: 'En curso',
  pending: 'Pendiente',
  completed: 'Completado',
  complete: 'Completado',
  finished: 'Finalizado',
  approved: 'Aprobado',
  reviewed: 'Revisado',
  rejected: 'Rechazado',
  failed: 'Fallido',
  error: 'Error'
}

export function normalizeStatus(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
}

export function statusLabel(value) {
  if (!value) return 'Sin estado'
  const key = normalizeStatus(value)
  return statusLabels[key] ?? String(value)
}

export function statusTone(value) {
  const key = normalizeStatus(value)
  if (key.includes('approved') || key.includes('complete') || key.includes('finished') || key.includes('reviewed')) return 'success'
  if (key.includes('failed') || key.includes('error') || key.includes('rejected') || key.includes('discard') || key.includes('critical') || key.includes('high')) return 'danger'
  if (key.includes('running') || key.includes('processing') || key.includes('evaluating') || key.includes('pending') || key.includes('upload') || key.includes('medium')) return 'warning'
  if (key.includes('low') || key.includes('info')) return 'info'
  if (key.includes('received') || key.includes('draft') || !key) return 'neutral'
  return 'info'
}

export function isTerminalStatus(value) {
  const key = normalizeStatus(value)
  return ['completed', 'complete', 'finished', 'approved', 'rejected', 'failed', 'error'].some((status) => key.includes(status))
}

export function phaseClasses(phase) {
  const key = normalizeStatus(phase)
  if (key.includes('error') || key.includes('fail')) return 'border-l-red-400 bg-red-500/10'
  if (key.includes('mercado') || key.includes('market') || key.includes('web') || key.includes('tavily')) return 'border-l-orion-yellow bg-orion-yellow/5'
  if (key.includes('bcv') || key.includes('rate') || key.includes('conversion')) return 'border-l-amber-300 bg-amber-500/5'
  if (key.includes('calc') || key.includes('audit') || key.includes('arithmetic') || key.includes('scope')) return 'border-l-sky-400 bg-sky-500/5'
  if (key.includes('extract') || key.includes('ingest') || key.includes('lectura') || key.includes('read')) return 'border-l-blue-400 bg-blue-500/5'
  return 'border-l-white/20 bg-white/[0.03]'
}

export function computeProgress(events = [], isComplete = false) {
  if (isComplete) return 100
  const phases = new Set(events.map((event) => normalizeStatus(event?.phase)).filter(Boolean))
  const phaseScore = Math.min(phases.size / 6, 1) * 75
  const eventScore = Math.min(events.length / 30, 1) * 25
  return Math.max(events.length ? 5 : 0, Math.round(phaseScore + eventScore))
}

export const suggestedQuestions = [
  '¿Cuál es la propuesta recomendada y por qué?',
  '¿Qué costos ocultos detectaron en las propuestas?',
  '¿Hay diferencias entre el total declarado y el recalculado?',
  '¿Qué hallazgos críticos debo revisar antes de adjudicar?'
]

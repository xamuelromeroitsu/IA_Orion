import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Lock } from 'lucide-react'
import { api, normalizeApiError } from '../lib/api'
import { canRole } from '../lib/constants'
import { useEvaluationStore } from '../store/evaluation'
import { useSessionStore } from '../store/session'
import StatusBadge from './StatusBadge'

export default function ReviewActions({ evaluation, onUpdated }) {
  const role = useSessionStore((state) => state.role)
  const user = useSessionStore((state) => state.user)
  const upsertEvaluation = useSessionStore((state) => state.upsertEvaluation)
  const activeEvaluationId = useEvaluationStore((state) => state.activeEvaluationId)
  const [notes, setNotes] = useState(evaluation?.reviewNotes ?? '')
  const [reviewer, setReviewer] = useState('')
  const [approver, setApprover] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user?.name) {
      setReviewer((current) => current || user.name)
      setApprover((current) => current || user.name)
    }
    setNotes((current) => current || evaluation?.reviewNotes || '')
  }, [user?.name, evaluation?.reviewNotes])

  const canReview = canRole(role, 'review')
  const canApprove = canRole(role, 'approve')
  const evaluationId = evaluation?.id ?? activeEvaluationId

  const applyResult = (result) => {
    const nextEvaluation = result?.evaluation ?? result
    upsertEvaluation(nextEvaluation)
    onUpdated?.(nextEvaluation)
  }

  const handleReview = async (event) => {
    event.preventDefault()
    if (!evaluationId) return
    setIsSaving(true)
    setError(null)
    setSuccess('')
    try {
      const result = await api.patch(`/api/evaluations/${evaluationId}/review`, {
        notes,
        reviewer: reviewer || user?.name || role
      })
      applyResult(result)
      setSuccess('Revisión registrada correctamente')
    } catch (caught) {
      setError(normalizeApiError(caught).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!evaluationId) return
    setIsSaving(true)
    setError(null)
    setSuccess('')
    try {
      const result = await api.post(`/api/evaluations/${evaluationId}/approve`, {
        approver: approver || user?.name || role
      })
      applyResult(result)
      setSuccess('Adjudicación aprobada correctamente')
    } catch (caught) {
      setError(normalizeApiError(caught).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="orion-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orion-blue/15 text-sky-300">
            <ClipboardCheck size={19} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-orion-text">Revisión y aprobación</h2>
            <p className="text-xs text-slate-400">Acciones según el rol activo</p>
          </div>
        </div>
        <StatusBadge status={evaluation?.status ?? 'pending'} />
      </div>

      {!canReview && !canApprove ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-300">
          <Lock size={14} />
          Tu rol tiene acceso de solo lectura sobre esta corrida.
        </div>
      ) : null}

      {canReview ? (
        <form onSubmit={handleReview} className="space-y-3">
          <div>
            <label className="orion-label" htmlFor="review-notes">Notas de revisión</label>
            <textarea
              id="review-notes"
              className="orion-input min-h-[90px] resize-y"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observaciones sobre el dictamen y la evidencia"
            />
          </div>
          <div>
            <label className="orion-label" htmlFor="reviewer-name">Revisor</label>
            <input id="reviewer-name" className="orion-input" value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Nombre del revisor" />
          </div>
          <button type="submit" className="orion-button orion-button-primary w-full" disabled={!evaluationId || isSaving}>
            Guardar revisión
          </button>
        </form>
      ) : null}

      {canApprove ? (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div>
            <label className="orion-label" htmlFor="approver-name">Aprobador</label>
            <input id="approver-name" className="orion-input" value={approver} onChange={(event) => setApprover(event.target.value)} placeholder="Nombre del aprobador" />
          </div>
          <button type="button" className="orion-button orion-button-yellow w-full" disabled={!evaluationId || isSaving} onClick={handleApprove}>
            <CheckCircle2 size={16} />
            Aprobar adjudicación
          </button>
        </div>
      ) : null}

      {evaluation?.reviewNotes ? (
        <div className="rounded-xl bg-orion-background/50 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Última revisión</p>
          <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-200">{evaluation.reviewNotes}</p>
          {evaluation.reviewedBy ? <p className="mt-1 text-[11px] text-orion-yellow">{evaluation.reviewedBy}</p> : null}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-300">{success}</p> : null}
    </section>
  )
}

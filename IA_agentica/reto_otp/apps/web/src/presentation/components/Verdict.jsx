import { Award, Ban, TrendingUp } from 'lucide-react'
import { formatUsd, summaryText, toNumber } from '../lib/formatters'
import StatusBadge from './StatusBadge'

function entryLabel(entry) {
  if (typeof entry === 'string') return entry
  return entry?.supplier ?? entry?.fileName ?? entry?.analysisId ?? entry?.name ?? 'Propuesta'
}

export default function Verdict({ evaluation, analyses = [] }) {
  if (!evaluation) return null
  const rows = Array.isArray(evaluation.comparison) ? evaluation.comparison : []
  const recommendedRow = rows.find((row) => row.analysisId === evaluation.recommendedId)
  const recommendedAnalysis = analyses.find((analysis) => analysis.id === evaluation.recommendedId)
  const recommendation = recommendedAnalysis?.supplier ?? recommendedRow?.supplier ?? recommendedRow?.fileName ?? evaluation.recommendedId ?? '—'
  const discards = rows.filter((row) => /discard|reject|descart|rechaz/i.test(String(row.decision ?? '')))
  const ranking = Array.isArray(evaluation.ranking) ? evaluation.ranking : []
  const summary = summaryText(evaluation.summary)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section className="orion-card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orion-yellow/15 text-orion-yellow">
              <Award size={20} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Veredicto</p>
              <h2 className="text-lg font-bold text-orion-text">{recommendation}</h2>
            </div>
          </div>
          <StatusBadge status={evaluation.status} />
        </div>

        {summary ? <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{summary}</p> : null}

        {recommendedRow ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-orion-background/50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">TCO</p>
              <p className="text-sm font-semibold text-orion-yellow">{formatUsd(recommendedRow.tcoUsd)}</p>
            </div>
            <div className="rounded-xl bg-orion-background/50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Declarado</p>
              <p className="text-sm font-semibold text-orion-text">{formatUsd(recommendedRow.declaredTotal)}</p>
            </div>
            <div className="rounded-xl bg-orion-background/50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Costos ocultos</p>
              <p className="text-sm font-semibold text-orion-text">{formatUsd(recommendedRow.hiddenCostsUsd)}</p>
            </div>
          </div>
        ) : null}

        {ranking.length ? (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-300">
              <TrendingUp size={14} />
              Ranking
            </p>
            <ol className="space-y-1.5">
              {ranking.map((entry, index) => (
                <li key={`${entryLabel(entry)}-${index}`} className="flex items-center gap-3 rounded-lg bg-orion-background/40 px-3 py-2 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orion-blue/20 text-xs font-bold text-sky-200">{index + 1}</span>
                  <span className="flex-1 text-orion-text">{entryLabel(entry)}</span>
                  {toNumber(entry?.tcoUsd) ? <span className="text-xs text-orion-yellow">{formatUsd(entry.tcoUsd)}</span> : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <section className="orion-card space-y-3 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
            <Ban size={19} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Dictamen de descartes</p>
            <h2 className="text-base font-semibold text-orion-text">{discards.length} propuesta(s)</h2>
          </div>
        </div>
        {discards.length ? (
          <ul className="space-y-2">
            {discards.map((row, index) => (
              <li key={`${row.analysisId ?? row.fileName}-${index}`} className="rounded-xl border border-red-400/20 bg-red-500/5 px-3 py-2.5">
                <p className="text-sm font-semibold text-red-200">{row.supplier ?? row.fileName ?? row.analysisId}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{row.reason || 'Sin motivo registrado'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No se registraron propuestas descartadas.</p>
        )}
      </section>
    </div>
  )
}

import { formatPercent, formatUsd, toNumber } from '../lib/formatters'
import StatusBadge from './StatusBadge'

function decisionTone(decision) {
  const key = String(decision ?? '').toLowerCase()
  if (/recommend|recommended|ganador|seleccionad/.test(key)) return 'success'
  if (/discard|reject|descart|rechaz/.test(key)) return 'danger'
  if (key) return 'warning'
  return 'neutral'
}

export default function ComparisonTable({ rows = [], recommendedId }) {
  if (!rows.length) return null

  return (
    <div className="orion-scroll overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
            <th className="px-3 py-3 font-semibold">Proveedor</th>
            <th className="px-3 py-3 text-right font-semibold">Total declarado / base</th>
            <th className="px-3 py-3 text-right font-semibold">Recalculado</th>
            <th className="px-3 py-3 text-right font-semibold">Costos ocultos</th>
            <th className="px-3 py-3 text-right font-semibold">TCO USD</th>
            <th className="px-3 py-3 text-right font-semibold">Desviación %</th>
            <th className="px-3 py-3 font-semibold">Decisión</th>
            <th className="px-3 py-3 font-semibold">Razón</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, index) => {
            const isRecommended = row.analysisId === recommendedId || /recommend|ganador|seleccionad/i.test(String(row.decision ?? ''))
            const isDiscarded = /discard|reject|descart|rechaz/i.test(String(row.decision ?? ''))
            const hiddenCosts = row.hiddenCostsUsd == null ? toNumber(row.tcoUsd) - toNumber(row.calculatedTotal) : row.hiddenCostsUsd
            const rowClasses = isRecommended
              ? 'bg-orion-yellow/10 ring-1 ring-inset ring-orion-yellow/30'
              : isDiscarded
                ? 'bg-red-500/5'
                : ''
            return (
              <tr key={row.analysisId ?? `${row.fileName}-${index}`} className={rowClasses}>
                <td className="px-3 py-3">
                  <p className="font-semibold text-orion-text">{row.supplier ?? 'Proveedor sin nombre'}</p>
                  <p className="text-xs text-slate-400">
                    {row.fileName}
                    {row.kind === 'spreadsheet' ? ' · Excel: 1 unidad por artículo' : ''}
                  </p>
                </td>
                <td className="px-3 py-3 text-right text-slate-200">{formatUsd(row.declaredTotal)}</td>
                <td className="px-3 py-3 text-right text-slate-200">{formatUsd(row.calculatedTotal)}</td>
                <td className="px-3 py-3 text-right text-orion-yellow">{formatUsd(hiddenCosts)}</td>
                <td className={`px-3 py-3 text-right font-bold ${isRecommended ? 'text-orion-yellow' : 'text-orion-text'}`}>
                  {formatUsd(row.tcoUsd)}
                </td>
                <td className="px-3 py-3 text-right text-slate-200">{formatPercent(row.deviationPct)}</td>
                <td className="px-3 py-3"><StatusBadge status={row.decision || 'pending'} tone={decisionTone(row.decision)} /></td>
                <td className="max-w-sm px-3 py-3 text-xs leading-relaxed text-slate-300">{row.reason || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

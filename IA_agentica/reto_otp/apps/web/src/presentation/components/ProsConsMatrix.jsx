import { Check, X } from 'lucide-react'
import { toTextList } from '../lib/formatters'

export default function ProsConsMatrix({ rows = [], recommendedId }) {
  if (!rows.length) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row, index) => {
        const pros = toTextList(row.pros)
        const cons = toTextList(row.cons)
        const isRecommended = row.analysisId === recommendedId
        return (
          <article key={row.analysisId ?? `${row.fileName}-${index}`} className={`orion-card space-y-3 p-4 ${isRecommended ? 'ring-1 ring-orion-yellow/40' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-orion-text">{row.supplier ?? row.fileName ?? 'Proveedor'}</h3>
              {isRecommended ? <span className="rounded-full bg-orion-yellow/15 px-2 py-0.5 text-[10px] font-bold uppercase text-orion-yellow">Recomendada</span> : null}
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                <Check size={13} />
                Pros
              </p>
              {pros.length ? (
                <ul className="space-y-1 text-xs leading-relaxed text-slate-200">
                  {pros.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`}>· {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Sin ventajas registradas</p>
              )}
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-300">
                <X size={13} />
                Contras
              </p>
              {cons.length ? (
                <ul className="space-y-1 text-xs leading-relaxed text-slate-200">
                  {cons.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`}>· {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Sin desventajas registradas</p>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

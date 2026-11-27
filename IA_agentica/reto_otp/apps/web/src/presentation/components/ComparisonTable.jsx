import { useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { formatPercent, formatUsd, toNumber } from '../lib/formatters'
import StatusBadge from './StatusBadge'

const filters = [
  { id: 'all', label: 'Todas' },
  { id: 'valid', label: 'Válidas' },
  { id: 'discarded', label: 'Descartadas' }
]

const sortColumns = [
  { key: 'declaredTotal', label: 'Total declarado / base' },
  { key: 'calculatedTotal', label: 'Recalculado' },
  { key: 'hiddenCostsUsd', label: 'Costos ocultos' },
  { key: 'tcoUsd', label: 'TCO USD' },
  { key: 'deviationPct', label: 'Desviación %' }
]

function decisionTone(decision) {
  const key = String(decision ?? '').toLowerCase()
  if (/recommend|recommended|ganador|seleccionad/.test(key)) return 'success'
  if (/discard|reject|descart|rechaz/.test(key)) return 'danger'
  if (key) return 'warning'
  return 'neutral'
}

function isDiscarded(row) {
  return /discard|reject|descart|rechaz/i.test(String(row.decision ?? ''))
}

function hiddenCosts(row) {
  return row.hiddenCostsUsd == null
    ? toNumber(row.tcoUsd) - toNumber(row.calculatedTotal)
    : toNumber(row.hiddenCostsUsd)
}

function sortValue(row, key) {
  return key === 'hiddenCostsUsd' ? hiddenCosts(row) : toNumber(row[key])
}

function SortableHeader({ column, sortKey, sortDir, onSort }) {
  const active = sortKey === column.key
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="px-3 py-3 text-right font-semibold"
    >
      <button type="button" className={`inline-flex min-h-11 items-center gap-1.5 transition ${active ? 'text-orion-yellow' : 'hover:text-orion-text'}`} onClick={() => onSort(column.key)}>
        {column.label}
        <ArrowUpDown size={12} aria-hidden="true" />
      </button>
    </th>
  )
}

export default function ComparisonTable({ rows = [], recommendedId }) {
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('tcoUsd')
  const [sortDir, setSortDir] = useState('asc')

  const visibleRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (filter === 'valid') return !isDiscarded(row)
      if (filter === 'discarded') return isDiscarded(row)
      return true
    })
    return [...filtered].sort((left, right) => {
      const difference = sortValue(left, sortKey) - sortValue(right, sortKey)
      return sortDir === 'asc' ? difference : -difference
    })
  }, [rows, filter, sortKey, sortDir])

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (!rows.length) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar propuestas">
        {filters.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={filter === option.id}
            className={`min-h-11 rounded-full border px-3 text-xs font-semibold transition ${
              filter === option.id ? 'border-orion-yellow/40 bg-orion-yellow/15 text-orion-yellow' : 'border-white/10 bg-white/5 text-slate-300 hover:text-orion-text'
            }`}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-500">{visibleRows.length} de {rows.length} filas</span>
      </div>

      <div className="orion-scroll max-h-[520px] overflow-auto rounded-xl ring-1 ring-inset ring-white/5">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-orion-surface/95 backdrop-blur">
            <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
              <th scope="col" className="px-3 py-3 font-semibold">Proveedor</th>
              {sortColumns.map((column) => (
                <SortableHeader key={column.key} column={column} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              ))}
              <th scope="col" className="px-3 py-3 font-semibold">Decisión</th>
              <th scope="col" className="px-3 py-3 font-semibold">Razón</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {visibleRows.map((row, index) => {
              const isRecommended = row.analysisId === recommendedId || /recommend|ganador|seleccionad/i.test(String(row.decision ?? ''))
              const discarded = isDiscarded(row)
              const rowClasses = isRecommended
                ? 'bg-orion-yellow/10 ring-1 ring-inset ring-orion-yellow/30'
                : discarded
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
                  <td className="px-3 py-3 text-right text-orion-yellow">{formatUsd(hiddenCosts(row))}</td>
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
        {!visibleRows.length ? <p className="px-3 py-6 text-center text-xs text-slate-400">No hay propuestas en este filtro.</p> : null}
      </div>
    </div>
  )
}

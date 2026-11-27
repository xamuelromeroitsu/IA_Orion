import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatUsd, toNumber } from '../lib/formatters'

const tooltipStyle = {
  backgroundColor: '#102A4C',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#E8F0FA',
  fontSize: 12
}

export default function TcoChart({ rows = [], recommendedId }) {
  const data = rows
    .map((row) => ({
      id: row.analysisId,
      name: row.supplier || row.fileName || 'Proveedor',
      tco: toNumber(row.tcoUsd)
    }))
    .sort((left, right) => left.tco - right.tco)

  if (!data.length) {
    return <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-xs text-slate-400">Sin valores de TCO para graficar.</p>
  }

  const summary = data.map((entry) => `${entry.name}: ${formatUsd(entry.tco)}`).join('; ')

  return (
    <div className="space-y-3">
      <div role="img" aria-label={`Costo total de propiedad por proveedor. ${summary}`} className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} interval={0} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#FACC15', fontWeight: 600 }}
              formatter={(value) => [formatUsd(value), 'TCO USD']}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="tco" radius={[8, 8, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell key={entry.id ?? entry.name} fill={entry.id === recommendedId ? '#FACC15' : '#2563EB'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orion-yellow" /> Propuesta recomendada</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orion-blue" /> Otras propuestas</span>
      </div>
    </div>
  )
}

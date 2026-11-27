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
  const data = rows.map((row) => ({
    id: row.analysisId,
    name: row.supplier || row.fileName || 'Proveedor',
    tco: toNumber(row.tcoUsd)
  }))

  if (!data.length) return null

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} interval={0} />
          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
          <Tooltip
            contentStyle={tooltipStyle}
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
  )
}

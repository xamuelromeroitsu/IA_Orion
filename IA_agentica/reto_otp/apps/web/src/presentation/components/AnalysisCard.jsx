import { AlertTriangle, Check, ExternalLink, FileSearch, X } from 'lucide-react'
import {
  evidenceText,
  formatCurrencyValue,
  formatUsd,
  severityClasses,
  summaryText,
  toNumber,
  toTextList
} from '../lib/formatters'
import StatusBadge from './StatusBadge'

function MoneyRow({ label, value, currency, emphasized = false }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${emphasized ? 'bg-orion-yellow/10 ring-1 ring-inset ring-orion-yellow/25' : 'bg-orion-background/50'}`}>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${emphasized ? 'text-orion-yellow' : 'text-orion-text'}`}>
        {formatCurrencyValue(value, currency)}
      </p>
    </div>
  )
}

function ListBlock({ title, items, icon: Icon, tone }) {
  if (!items.length) return null
  const iconClasses = tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-red-300' : 'text-sky-300'
  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${iconClasses}`}>
        <Icon size={14} />
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-relaxed text-slate-200">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'bad' ? 'bg-red-300' : tone === 'good' ? 'bg-emerald-300' : 'bg-sky-300'}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SpreadsheetPrices({ items, currency, budgetReferenceUsd }) {
  if (!items.length) return null

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Precio unitario por artículo</p>
        <p className="mt-1 text-xs text-slate-400">
          Se analiza una unidad por artículo; el inventario disponible no se multiplica.
          {budgetReferenceUsd > 0 ? ` Presupuesto disponible: ${formatUsd(budgetReferenceUsd)}.` : ' No se indicó presupuesto disponible.'}
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-xs">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-3 py-2 font-semibold">Artículo</th>
              <th className="px-3 py-2 font-semibold">Cantidad</th>
              <th className="px-3 py-2 font-semibold">Precio unitario</th>
              <th className="px-3 py-2 font-semibold">Presupuesto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item, index) => (
              <tr key={`${item.description}-${index}`} className="text-slate-200">
                <td className="px-3 py-2">{item.description}</td>
                <td className="px-3 py-2">{item.qty}</td>
                <td className="px-3 py-2">
                  {formatCurrencyValue(item.unitPrice, currency)}
                  {currency !== 'USD' && item.unitPriceUsd != null ? (
                    <span className="ml-1 text-slate-400">({formatUsd(item.unitPriceUsd)})</span>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  {item.withinBudget == null ? (
                    <StatusBadge status="neutral" label="Sin presupuesto" />
                  ) : (
                    <StatusBadge
                      status="info"
                      tone={item.withinBudget ? 'success' : 'warning'}
                      label={item.withinBudget ? 'Dentro del presupuesto' : 'Supera el presupuesto'}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AnalysisCard({ analysis, document, budgetReferenceUsd = 0 }) {
  const currency = analysis?.currency || 'USD'
  const isSpreadsheet = analysis?.kind === 'spreadsheet'
  const items = Array.isArray(analysis?.items) ? analysis.items : []
  const pros = toTextList(analysis?.pros)
  const cons = toTextList(analysis?.cons)
  const finePrint = toTextList(analysis?.finePrint)
  const findings = Array.isArray(analysis?.findings) ? analysis.findings : []
  const rawConfidence = toNumber(analysis?.confidence)
  const confidence = analysis?.confidence == null ? null : Math.round(rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence)

  return (
    <article className="orion-card space-y-5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orion-blue/15 text-sky-300">
            <FileSearch size={19} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-orion-text">{analysis?.supplier || 'Proveedor sin identificar'}</h3>
            <p className="text-xs text-slate-400">{document?.fileName || analysis?.kind || 'Análisis del documento'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {analysis?.kind ? <StatusBadge status="info" label={analysis.kind} /> : null}
          {confidence != null ? <StatusBadge status="neutral" label={`Confianza ${confidence}%`} /> : null}
        </div>
      </header>

      {summaryText(analysis?.summary) ? (
        <p className="text-sm leading-relaxed text-slate-200">{summaryText(analysis.summary)}</p>
      ) : null}

      {summaryText(analysis?.conclusion) ? (
        <div className="rounded-xl border-l-2 border-l-orion-blue bg-orion-blue/10 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">Conclusión</p>
          <p className="mt-1 text-sm leading-relaxed text-orion-text">{summaryText(analysis.conclusion)}</p>
        </div>
      ) : null}

      {isSpreadsheet ? (
        <div className="grid grid-cols-2 gap-2">
          <MoneyRow label="Suma (1 unidad por artículo)" value={analysis?.calculatedTotal} currency={currency} />
          <MoneyRow label="TCO (1 unidad c/u)" value={analysis?.tcoUsd} currency="USD" emphasized />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <MoneyRow label="Declarado" value={analysis?.declaredTotal} currency={currency} />
          <MoneyRow label="Recalculado" value={analysis?.calculatedTotal} currency={currency} />
          <MoneyRow label="Real USD" value={analysis?.realTotalUsd} currency="USD" />
          <MoneyRow label="TCO USD" value={analysis?.tcoUsd} currency="USD" emphasized />
        </div>
      )}

      {isSpreadsheet ? (
        <SpreadsheetPrices items={items} currency={currency} budgetReferenceUsd={budgetReferenceUsd} />
      ) : null}

      {finePrint.length ? (
        <div className="rounded-xl border border-orion-yellow/35 bg-orion-yellow/10 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orion-yellow">
            <AlertTriangle size={14} />
            Letra pequeña
          </p>
          <ul className="mt-2 space-y-1.5">
            {finePrint.map((item, index) => (
              <li key={`${item}-${index}`} className="text-sm leading-relaxed text-yellow-100/90">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pros.length || cons.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          <ListBlock title="Pros" items={pros} icon={Check} tone="good" />
          <ListBlock title="Contras" items={cons} icon={X} tone="bad" />
        </div>
      ) : null}

      {findings.length ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Hallazgos ({findings.length})</p>
          {findings.map((finding, index) => (
            <div key={`${finding?.id ?? 'finding'}-${index}`} className={`rounded-xl border px-4 py-3 ${severityClasses(finding?.severity)}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{finding?.title || 'Hallazgo'}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {finding?.category ? <span className="text-[11px] uppercase tracking-wide opacity-80">{finding.category}</span> : null}
                  <StatusBadge status={finding?.severity || 'info'} />
                </div>
              </div>
              {summaryText(finding?.detail) ? <p className="mt-1.5 text-sm leading-relaxed opacity-90">{summaryText(finding.detail)}</p> : null}
              {evidenceText(finding?.evidence) ? (
                <p className="mt-2 break-words text-xs leading-relaxed opacity-75">Evidencia: {evidenceText(finding.evidence)}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
                {toNumber(finding?.amountImpactUsd) ? <span>Impacto: {formatUsd(finding.amountImpactUsd)}</span> : null}
                {finding?.sourceUrl ? (
                  <a href={finding.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
                    Fuente
                    <ExternalLink size={12} />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}

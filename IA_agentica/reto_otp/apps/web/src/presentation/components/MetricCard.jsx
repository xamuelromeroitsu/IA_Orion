export default function MetricCard({ label, value, hint, icon: Icon, accent = 'blue' }) {
  const accentClasses = accent === 'yellow' ? 'bg-orion-yellow/10 text-orion-yellow' : 'bg-orion-blue/15 text-sky-300'
  return (
    <div className="orion-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-orion-text">{value}</p>
        </div>
        {Icon ? (
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses}`}>
            <Icon size={19} />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-3 text-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}

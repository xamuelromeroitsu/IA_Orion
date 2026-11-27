export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, children }) {
  return (
    <div className="orion-card flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      {Icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orion-blue/15 text-orion-yellow">
          <Icon size={26} />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-orion-text">{title}</h3>
        {description ? <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-300">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="orion-button orion-button-primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
      {children}
    </div>
  )
}

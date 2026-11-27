export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none ${className}`} aria-hidden="true" />
}

export function LoadingBlock({ label = 'Cargando…', lines = 3 }) {
  return (
    <div role="status" className="orion-card space-y-4 p-5">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className={index === lines - 1 ? 'h-3 w-2/3' : 'h-3 w-full'} />
        ))}
      </div>
    </div>
  )
}

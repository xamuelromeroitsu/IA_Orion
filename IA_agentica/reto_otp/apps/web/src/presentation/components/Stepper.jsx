import { Check, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const steps = [
  { to: '/', label: 'Proyecto' },
  { to: '/documentos', label: 'Documentos' },
  { to: '/evaluacion', label: 'Evaluación' },
  { to: '/reportes', label: 'Informe' }
]

// El paso activo se deduce de la ruta; no hay estado que sincronizar.
export default function Stepper({ current }) {
  const currentIndex = steps.findIndex((step) => step.to === current)

  return (
    <nav aria-label="Progreso de la evaluación" className="orion-card flex flex-wrap items-center gap-2 p-3">
      {steps.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <Link
            key={step.to}
            to={step.to}
            aria-current={isCurrent ? 'step' : undefined}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              isCurrent ? 'bg-orion-yellow/15 text-orion-yellow ring-1 ring-inset ring-orion-yellow/30' : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${isDone ? 'bg-emerald-400/20 text-emerald-200' : isCurrent ? 'bg-orion-yellow text-orion-background' : 'bg-white/10 text-slate-400'}`}>
              {isDone ? <Check size={13} /> : index + 1}
            </span>
            {step.label}
            {index < steps.length - 1 ? <ChevronRight size={13} className="hidden text-slate-500 sm:block" aria-hidden="true" /> : null}
          </Link>
        )
      })}
    </nav>
  )
}

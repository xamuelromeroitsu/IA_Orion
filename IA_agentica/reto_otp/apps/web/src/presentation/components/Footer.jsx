import { ArrowUpRight, Lock, Mail, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

const contact = 'xamuelromero.itsu@gmail.com'

const productLinks = [
  { to: '/', label: 'Panel' },
  { to: '/documentos', label: 'Documentos' },
  { to: '/evaluacion', label: 'Evaluación' },
  { to: '/comparativa', label: 'Comparativa' },
  { to: '/chat', label: 'Chat documental' },
  { to: '/reportes', label: 'Reportes' }
]

const legalLinks = [
  { to: '/privacidad', label: 'Privacidad' },
  { to: '/terminos', label: 'Términos de uso' },
  { to: '/seguridad', label: 'Seguridad' },
  { to: '/accesibilidad', label: 'Accesibilidad' }
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-orion-background/70 px-4 py-8 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1500px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orion-blue text-white">
              <Shield size={18} />
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-[0.18em] text-orion-text">ORION</p>
              <p className="text-[10px] uppercase tracking-wider text-orion-yellow">Evaluador de propuestas</p>
            </div>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-slate-400">Dictámenes auditables, TCO real y trazabilidad para compras públicas y privadas.</p>
          <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"><Lock size={12} /> TLS 1.2/1.3 · AES-256-GCM</p>
        </div>

        <nav aria-label="Enlaces del producto" className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Producto</p>
          {productLinks.map((link) => (
            <Link key={link.to} to={link.to} className="flex min-h-11 items-center gap-1.5 text-xs text-slate-400 transition hover:text-orion-yellow">
              {link.label}
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          ))}
        </nav>

        <nav aria-label="Enlaces legales" className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Legal</p>
          {legalLinks.map((link) => (
            <Link key={link.to} to={link.to} className="flex min-h-11 items-center text-xs text-slate-400 transition hover:text-orion-yellow">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Contacto</p>
          <a href={`mailto:${contact}`} className="flex min-h-11 items-center gap-2 break-all text-xs text-slate-300 transition hover:text-orion-yellow">
            <Mail size={14} />
            {contact}
          </a>
          <p className="text-xs leading-relaxed text-slate-500">Demo del hackatón: no subas información sensible ni confidencial.</p>
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-[11px] text-slate-500">
        <span>© 2026 ORION · Hackatón Venezuela INNOVA 2026</span>
        <span>Versión demo · Datos de prueba</span>
      </div>
    </footer>
  )
}

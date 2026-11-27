import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileText,
  GitCompare,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Shield,
  Wifi,
  WifiOff,
  X
} from 'lucide-react'
import { getInitials } from '../lib/formatters'
import { roles } from '../lib/constants'
import { useSessionStore } from '../store/session'
import { useHideOnScroll } from '../hooks/useHideOnScroll'
import { useRouteMeta } from '../hooks/useRouteMeta'
import Footer from './Footer'
import OfflineBanner from './OfflineBanner'

const navigation = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/evaluacion', label: 'Evaluación', icon: Activity },
  { to: '/comparativa', label: 'Comparativa', icon: GitCompare },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 }
]

const pageTitles = {
  '/': 'Panel de control',
  '/documentos': 'Documentos',
  '/evaluacion': 'Evaluación',
  '/comparativa': 'Comparativa',
  '/chat': 'Chat documental',
  '/reportes': 'Reportes',
  '/privacidad': 'Privacidad',
  '/terminos': 'Términos de uso',
  '/seguridad': 'Seguridad',
  '/accesibilidad': 'Accesibilidad'
}

export default function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const user = useSessionStore((state) => state.user)
  const role = useSessionStore((state) => state.role)
  const setRole = useSessionStore((state) => state.setRole)
  const connectionStatus = useSessionStore((state) => state.connectionStatus)
  const { isHidden, headerRef } = useHideOnScroll({ resetKey: location.pathname })

  const isOnline = connectionStatus === 'online'
  const connectionLabel = isOnline ? 'En línea' : connectionStatus === 'offline' ? 'Sin conexión' : 'Verificando'
  const userRoleLabel = roles.find((item) => item.id === user?.role)?.label ?? user?.role ?? 'Demo'
  const currentTitle = pageTitles[location.pathname] ?? 'ORION'

  useRouteMeta(currentTitle)

  return (
    <div className="flex min-h-screen flex-col bg-orion-background text-orion-text">
      {isMenuOpen ? (
        <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setIsMenuOpen(false)} />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-orion-background/95 px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orion-blue text-white shadow-lg shadow-orion-blue/25">
              <Shield size={21} />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-[0.2em] text-orion-text">ORION</p>
              <p className="text-[10px] uppercase tracking-wider text-orion-yellow">Evaluador de propuestas</p>
            </div>
          </div>
          <button type="button" aria-label="Cerrar menú" className="text-slate-400 lg:hidden" onClick={() => setIsMenuOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="mt-8 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-orion-blue/20 text-orion-yellow ring-1 ring-inset ring-orion-blue/40' : 'text-slate-300 hover:bg-white/5 hover:text-orion-text'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Tasa BCV</p>
            <p className="mt-1 text-xs text-slate-300">Se consulta en el panel de control</p>
          </div>
          <p className="text-center text-[10px] tracking-wide text-slate-500">ORION · Hackatón Venezuela INNOVA 2026</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-orion-yellow focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-orion-background">
          Saltar al contenido
        </a>

        <OfflineBanner visible={connectionStatus === 'offline'} onRetry={() => window.location.reload()} />

        <header
          ref={headerRef}
          aria-hidden={isHidden}
          inert={isHidden ? '' : undefined}
          className={`sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-orion-background/85 px-4 py-3 backdrop-blur transition-[transform,opacity] duration-200 motion-reduce:transition-none lg:px-8 ${
            isHidden ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Abrir menú" className="flex min-h-11 items-center text-slate-300 lg:hidden" onClick={() => setIsMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                Espacio de trabajo
                <ChevronRight size={11} aria-hidden="true" />
                <span className="text-slate-400">{currentTitle}</span>
              </p>
              <h1 className="text-base font-semibold text-orion-text">{currentTitle}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
              {isOnline ? <Wifi size={14} className="text-emerald-300" /> : <WifiOff size={14} className="text-red-300" />}
              <span className={isOnline ? 'text-emerald-200' : 'text-red-200'}>{connectionLabel}</span>
            </div>

            <div className="relative">
              <select
                aria-label="Rol activo"
                className="min-h-11 appearance-none rounded-xl border border-white/10 bg-orion-surface py-2 pl-3 pr-8 text-xs font-semibold text-orion-text outline-none focus:border-orion-blue"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {roles.map((item) => (
                  <option key={item.id} value={item.id}>
                    Ver como: {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-400" />
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orion-yellow text-xs font-bold text-orion-background">
                {getInitials(user?.name ?? 'Demo User')}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-orion-text">{user?.name ?? 'Usuario demo'}</p>
                <p className="text-[10px] text-orion-yellow">{userRoleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 outline-none lg:px-8">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  )
}

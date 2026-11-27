import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

const contact = 'xamuelromero.itsu@gmail.com'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-orion-background px-4 text-orion-text">
        <div className="orion-card w-full max-w-lg space-y-4 p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <AlertTriangle size={26} />
          </span>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold">La interfaz encontró un error</h1>
            <p className="text-sm leading-relaxed text-slate-300">Puedes recargar la página. Si vuelve a ocurrir, envía el detalle al correo de soporte.</p>
          </div>
          <p className="break-words rounded-xl bg-white/5 px-3 py-2 font-mono text-[11px] text-slate-400">{this.state.error.message}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="orion-button orion-button-primary" onClick={() => window.location.reload()}>
              Recargar
            </button>
            <a className="orion-button orion-button-secondary" href={`mailto:${contact}?subject=Error%20en%20ORION`}>
              Contactar soporte
            </a>
          </div>
        </div>
      </div>
    )
  }
}

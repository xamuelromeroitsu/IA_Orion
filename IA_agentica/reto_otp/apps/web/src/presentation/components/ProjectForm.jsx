import { useState } from 'react'
import { ArrowRight, FolderPlus } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { useSessionStore } from '../store/session'

const emptyForm = {
  name: '',
  description: '',
  operationType: 'compra',
  businessType: '',
  location: '',
  budgetReferenceUsd: ''
}

export default function ProjectForm({ onCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [validationError, setValidationError] = useState('')
  const { send, isLoading, error } = useApi()
  const upsertProject = useSessionStore((state) => state.upsertProject)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setValidationError('El nombre del proyecto es obligatorio')
      return
    }
    if (!form.businessType.trim()) {
      setValidationError('El sector o tipo de negocio es obligatorio')
      return
    }
    setValidationError('')
    try {
      const project = await send('/api/projects', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          operationType: form.operationType,
          businessType: form.businessType.trim(),
          location: form.location.trim(),
          budgetReferenceUsd: form.budgetReferenceUsd === '' ? null : Number(form.budgetReferenceUsd)
        }
      })
      upsertProject(project)
      setForm(emptyForm)
      onCreated?.(project)
    } catch (caught) {
      setValidationError(caught?.message ?? 'No se pudo crear el proyecto')
    }
  }

  const displayedError = validationError || error?.message

  return (
    <form id="project-form" onSubmit={handleSubmit} className="orion-card space-y-4 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orion-blue/15 text-sky-300">
          <FolderPlus size={19} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-orion-text">Nuevo proyecto</h2>
          <p className="text-xs text-slate-400">Define el punto de partida de la evaluación.</p>
        </div>
      </div>

      <div>
        <label className="orion-label" htmlFor="project-name">Nombre</label>
        <input id="project-name" name="name" className="orion-input" value={form.name} onChange={handleChange} placeholder="Renovación de equipos" />
      </div>

      <div>
        <label className="orion-label" htmlFor="project-description">Descripción</label>
        <textarea id="project-description" name="description" className="orion-input min-h-[72px] resize-y" value={form.description} onChange={handleChange} placeholder="Alcance, cantidad y requisitos" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="orion-label" htmlFor="project-operation-type">Tipo de operación</label>
          <select id="project-operation-type" name="operationType" className="orion-input" value={form.operationType} onChange={handleChange}>
            <option value="compra">Compra</option>
            <option value="venta">Venta</option>
          </select>
        </div>
        <div>
          <label className="orion-label" htmlFor="project-business-type">Sector o tipo de negocio</label>
          <input id="project-business-type" name="businessType" className="orion-input" value={form.businessType} onChange={handleChange} placeholder="Celulares, repuestos de autos, casas..." />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="orion-label" htmlFor="project-location">Ubicación</label>
          <input id="project-location" name="location" className="orion-input" value={form.location} onChange={handleChange} placeholder="Caracas, VE" />
        </div>
        <div>
          <label className="orion-label" htmlFor="project-budget">Presupuesto disponible (USD)</label>
          <input id="project-budget" name="budgetReferenceUsd" type="number" min="0" step="0.01" className="orion-input" value={form.budgetReferenceUsd} onChange={handleChange} placeholder="250000" />
        </div>
      </div>

      {displayedError ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{displayedError}</p> : null}

      <button type="submit" className="orion-button orion-button-primary w-full" disabled={isLoading}>
        {isLoading ? 'Creando…' : 'Crear proyecto'}
        <ArrowRight size={16} />
      </button>
    </form>
  )
}

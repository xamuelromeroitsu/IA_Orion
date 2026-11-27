import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const contact = 'xamuelromero.itsu@gmail.com'

// Una sola plantilla para cuatro rutas: el texto cambia, el contexto visual no.
const content = {
  privacidad: {
    title: 'Privacidad',
    intro: 'ORION es una demo de hackatón. Tratamos la información únicamente para evaluar propuestas y mostrar trazabilidad del dictamen.',
    sections: [
      {
        title: 'Datos que tratamos',
        body: 'Nombre y descripción del proyecto, archivos cargados, resultados del análisis, eventos de trazabilidad, mensajes del chat y el rol seleccionado en la interfaz.',
        items: ['Los documentos se tratan como datos no confiables: nunca se ejecutan instrucciones que contengan.', 'El navegador guarda solo el rol activo en localStorage; no usamos cookies propias.']
      },
      {
        title: 'Finalidad y almacenamiento',
        body: 'Los datos permiten extraer propuestas, calcular el costo total real, ordenar candidatas y generar exportaciones. La persistencia puede ser local (demo sin servicios) o Supabase cuando está configurado.',
        items: ['Transporte con TLS 1.2/1.3.', 'Documentos cifrados con AES-256-GCM antes de persistirse.', 'Gemini, Tavily y BCV intervienen solo como servicios de extracción o referencia.']
      },
      {
        title: 'Conservación y derechos',
        body: 'Esta demostración no implementa borrado definitivo ni exportación de datos personales. No subas información sensible. Para consultas sobre los datos, escribe al correo de contacto.'
      }
    ]
  },
  terminos: {
    title: 'Términos de uso',
    intro: 'El acceso a ORION es demostrativo y no constituye asesoría legal, contable ni técnica.',
    sections: [
      { title: 'Uso permitido', body: 'Puedes usar la demo con fines de evaluación, prueba y demostración del lote de propuestas.' },
      { title: 'Resultados', body: 'Los descartes y el ranking los calculan reglas deterministas en código; el modelo propone extracciones y no decide la adjudicación.' },
      { title: 'Responsabilidad', body: 'Las cifras y recomendaciones deben contrastarse con los documentos fuente antes de tomar decisiones reales.' }
    ]
  },
  seguridad: {
    title: 'Seguridad',
    intro: 'La seguridad mínima del MVP combina cifrado, roles, trazabilidad y separación entre datos y reglas.',
    sections: [
      { title: 'Protección de documentos', body: 'Los archivos se cifran con AES-256-GCM y se almacenan con iv, tag y sha256. Las claves viven fuera del repositorio.' },
      { title: 'Control de acceso', body: 'Los roles limitan carga, evaluación y revisión. Las políticas anónimas de RLS y el CORS abierto existen solo para la demo y deben retirarse en producción.' },
      { title: 'Inyección de contenido', body: 'El texto de propuestas y chats se cita como evidencia; nunca se interpreta como instrucciones del sistema.' }
    ]
  },
  accesibilidad: {
    title: 'Accesibilidad',
    intro: 'Buscamos que la plataforma sea usable con teclado, lectores de pantalla y preferencias de movimiento reducido.',
    sections: [
      { title: 'Navegación', body: 'El menú, las listas animadas y los formularios se pueden operar con teclado; el enlace “Saltar al contenido” evita repetir la navegación.' },
      { title: 'Estado y contraste', body: 'Los estados no dependen solo del color: se acompañan de texto, iconos y atributos ARIA.' },
      { title: 'Movimiento', body: 'Las animaciones respetan prefers-reduced-motion y se desactivan cuando el sistema lo solicita.' }
    ]
  }
}

export default function LegalPage({ type }) {
  const page = content[type] ?? content.privacidad

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-xs text-slate-300 transition hover:text-orion-yellow">
        <ArrowLeft size={15} />
        Volver al panel
      </Link>

      <section className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orion-yellow"><ShieldCheck size={14} /> Información legal</p>
        <h2 className="text-2xl font-bold text-orion-text">{page.title}</h2>
        <p className="text-sm leading-relaxed text-slate-300">{page.intro}</p>
      </section>

      {page.sections.map((section) => (
        <section key={section.title} className="orion-card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-orion-text">{section.title}</h3>
          <p className="text-sm leading-relaxed text-slate-300">{section.body}</p>
          {section.items?.length ? (
            <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-slate-400">
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </section>
      ))}

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
        <Mail size={15} className="text-orion-yellow" />
        Consultas: <a className="break-all text-orion-yellow hover:underline" href={`mailto:${contact}`}>{contact}</a>
      </section>
    </div>
  )
}

import { useEffect } from 'react'

// Título y scroll se tratan juntos: cada cambio de ruta debe sentirse como una página nueva.
export function useRouteMeta(title) {
  useEffect(() => {
    document.title = `${title} · ORION`
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [title])
}

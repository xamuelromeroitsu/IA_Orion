import { useEffect, useRef, useState } from 'react'

// El header se oculta solo por dirección de scroll; el espacio de sticky se conserva.
export function useHideOnScroll({ threshold = 80, delta = 8, resetKey = '' } = {}) {
  const headerRef = useRef(null)
  const lastYRef = useRef(0)
  const frameRef = useRef(0)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (frameRef.current) return
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0
        const y = Math.max(0, window.scrollY)
        const active = document.activeElement
        const interacting = headerRef.current?.contains(active)

        if (y <= threshold || y < lastYRef.current - delta || interacting) {
          setIsHidden(false)
          lastYRef.current = y
          return
        }
        if (y > lastYRef.current + delta) setIsHidden(true)
        lastYRef.current = y
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
    }
  }, [threshold, delta])

  useEffect(() => {
    lastYRef.current = window.scrollY
    setIsHidden(false)
  }, [resetKey])

  return { isHidden, headerRef }
}

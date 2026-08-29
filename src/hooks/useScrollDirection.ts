import { useEffect, useRef, useState } from 'react'

// Tracks whether the app's main scroll container is currently being
// scrolled up or down, so UI chrome (e.g. the mobile bottom nav) can hide
// itself out of the way while reading and reappear once the user scrolls
// back up. Snaps back to "up" near the very top so it's never stuck hidden.
export function useScrollDirection(threshold = 8) {
  const [direction, setDirection] = useState<'up' | 'down'>('up')
  const lastScrollTop = useRef(0)

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    function onScroll() {
      const current = main!.scrollTop
      if (current <= 0) {
        setDirection('up')
        lastScrollTop.current = 0
        return
      }
      const diff = current - lastScrollTop.current
      if (Math.abs(diff) > threshold) {
        setDirection(diff > 0 ? 'down' : 'up')
        lastScrollTop.current = current
      }
    }
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [threshold])

  return direction
}

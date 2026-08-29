import { useEffect, useState } from 'react'

// Tracks whether the app's main scroll container has been scrolled past a
// small threshold, so the header and per-tab UI can react (compact header,
// sticky mini search bar, etc).
export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    function onScroll() {
      setScrolled(main!.scrollTop > threshold)
    }
    onScroll()
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}

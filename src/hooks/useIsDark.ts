import { useEffect, useState } from 'react'
import { useThemeStore } from '../store/useThemeStore'

// Reactive resolved dark/light boolean, for the rare spot (inline styles,
// canvas/SVG colors) that can't be themed with a `dark:` Tailwind class.
export function useIsDark() {
  const mode = useThemeStore((s) => s.mode)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    function apply() {
      setIsDark(mode === 'dark' || (mode === 'system' && query.matches))
    }
    apply()
    if (mode !== 'system') return
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [mode])

  return isDark
}

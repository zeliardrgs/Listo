import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'

// Applies the resolved theme (mode, or the OS preference when mode is
// "system") as a `dark` class on <html> for Tailwind's class-based dark
// mode, and keeps it in sync with OS-level changes while on "system".
export function useTheme() {
  const mode = useThemeStore((s) => s.mode)

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')

    function apply() {
      const isDark = mode === 'dark' || (mode === 'system' && query.matches)
      document.documentElement.classList.toggle('dark', isDark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#7c3aed' : '#f5841f')
    }

    apply()
    if (mode !== 'system') return
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [mode])
}

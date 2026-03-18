import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sc-theme'

/**
 * Manages dark/light theme.
 * Persists to localStorage. Respects system preference on first visit.
 * Toggles a data-theme attribute on <html>.
 */
export function useTheme() {
  const getInitial = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const [theme, setTheme] = useState(() => {
    try { return getInitial() } catch { return 'dark' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggle, isDark: theme === 'dark' }
}

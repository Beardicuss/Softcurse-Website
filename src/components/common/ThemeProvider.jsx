import { useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'

/**
 * Mounted at the app root to initialise data-theme on <html>
 * before any page content paints. Renders nothing.
 */
export default function ThemeProvider() {
  const { theme } = useTheme()
  // useTheme already sets data-theme via useEffect; this component
  // just ensures the hook lives at the top of the tree so it runs
  // as early as possible and is shared across all children.
  return null
}

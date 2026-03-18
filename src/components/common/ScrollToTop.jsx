import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Scrolls to top on every route change — fixes SPA scroll persistence bug */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

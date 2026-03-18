import { useEffect } from 'react'

const BASE = 'SOFTCURSE'

/**
 * Sets document.title for SEO and browser tab clarity.
 * @param {string} title  – page-specific title, e.g. "The Lab"
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : BASE
    return () => { document.title = BASE }
  }, [title])
}

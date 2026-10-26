/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

const SiteLayoutContext = createContext(null)

export function SiteLayoutProvider({ children }) {
  const [layout, setLayout] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/layout', { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(result => { if (result?.layout) setLayout(result.layout) }).catch(() => {})
    return () => controller.abort()
  }, [])
  return <SiteLayoutContext.Provider value={layout}>{children}</SiteLayoutContext.Provider>
}

export function useSiteLayout() { return useContext(SiteLayoutContext) }

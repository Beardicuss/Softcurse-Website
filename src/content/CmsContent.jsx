/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CmsContext = createContext({ items: [], managed: new Set(), ready: false })

function toLegacy(item) {
  const primary = item.releases.find(release => release.isPrimary) || item.releases[0]
  return {
    ...item.data,
    type: item.type,
    id: item.slug,
    cmsId: item.id,
    name: item.title,
    title: item.title,
    image: item.assets.card?.url || item.assets.cover?.url || item.data.image,
    heroImage: item.assets.hero?.url || item.data.heroImage,
    character: item.assets.hologram?.url || item.assets.icon?.url || item.data.character,
    releases: item.releases,
    playUrl: primary?.kind === 'web' ? primary.url : item.data.playUrl,
    launchLabel: primary?.kind === 'web' ? primary.label : item.data.launchLabel,
    downloadReleases: item.releases.filter(release => release.kind === 'file'),
  }
}

export function CmsContentProvider({ children }) {
  const [state, setState] = useState({ items: [], managed: new Set(), ready: false })
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/content', { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('CMS unavailable')))
      .then(payload => setState({ items: payload.items.map(toLegacy), managed: new Set(payload.managed || []), ready: true }))
      .catch(error => { if (error.name !== 'AbortError') setState(previous => ({ ...previous, ready: true })) })
    return () => controller.abort()
  }, [])
  return <CmsContext.Provider value={state}>{children}</CmsContext.Provider>
}

export function useCmsItems(type, fallback = []) {
  const cms = useContext(CmsContext)
  return useMemo(() => {
    const fallbackItems = Array.isArray(fallback) ? fallback : Object.values(fallback)
    const visibleFallbacks = fallbackItems.filter(item => !cms.managed.has(`${type}:${item.id}`))
    const managedItems = cms.items.filter(item => item.type === type)
    return [...managedItems, ...visibleFallbacks]
  }, [cms, fallback, type])
}

export function useCmsRecord(type, slug, fallback) {
  const items = useCmsItems(type, fallback ? [fallback] : [])
  return items.find(item => item.id === slug)
}

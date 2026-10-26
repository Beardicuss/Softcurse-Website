import { useEffect } from 'react'

export default function IntegrationLoader() {
  useEffect(() => {
    const controller = new AbortController(), added = []
    fetch('/api/integrations', { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(result => {
      if (!result) return
      window.__SOFTCURSE_FEATURES = Object.freeze(result.flags || {})
      for (const item of result.scripts || []) {
        if (!item.src?.startsWith('https://') || !/^(sha256|sha384|sha512)-[A-Za-z0-9+/]+={0,2}(\s+(sha256|sha384|sha512)-[A-Za-z0-9+/]+={0,2})*$/.test(item.integrity || '') || document.querySelector(`script[data-integration-id="${CSS.escape(item.id)}"]`)) continue
        const script = document.createElement('script'); script.src = item.src; script.async = true; script.dataset.integrationId = item.id
        script.integrity = item.integrity; script.crossOrigin = 'anonymous'
        ;(item.location === 'head' ? document.head : document.body).appendChild(script); added.push(script)
      }
    }).catch(() => {})
    return () => { controller.abort(); added.forEach(element => element.remove()) }
  }, [])
  return null
}

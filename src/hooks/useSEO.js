import { useEffect } from 'react'

const SITE_URL  = 'https://softcursesystems.pages.dev'
const SITE_NAME = 'Softcurse Systems'
const DEFAULT_OG = `${SITE_URL}/og-image.png`
const DEFAULT_DESCRIPTION = 'Focused Windows software, experimental tools, browser games, and dark speculative fiction—built with purpose in a terminal-inspired digital universe.'

/**
 * Sets per-page SEO — title, description, OG tags, Twitter card.
 * Call at the top of every page component.
 */
export function useSEO({ title, description, image, url, type = 'website', noindex = false, structuredData }) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
    const fullUrl   = url ? `${SITE_URL}${url}` : SITE_URL
    const ogImage   = image ? new URL(image, SITE_URL).toString() : DEFAULT_OG

    // Title
    document.title = fullTitle

    const set = (selector, attr, value) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const [attrName, attrVal] = selector.match(/\[(.+?)="(.+?)"\]/).slice(1)
        el.setAttribute(attrName, attrVal)
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }

    // Description
    set('meta[name="description"]',        'content', description || DEFAULT_DESCRIPTION)

    // OG
    set('meta[property="og:title"]',       'content', fullTitle)
    set('meta[property="og:description"]', 'content', description || DEFAULT_DESCRIPTION)
    set('meta[property="og:url"]',         'content', fullUrl)
    set('meta[property="og:image"]',       'content', ogImage)
    set('meta[property="og:image:alt"]',   'content', `${title || SITE_NAME} — ${SITE_NAME}`)
    set('meta[property="og:type"]',        'content', type)

    // Twitter
    set('meta[name="twitter:title"]',       'content', fullTitle)
    set('meta[name="twitter:description"]', 'content', description || DEFAULT_DESCRIPTION)
    set('meta[name="twitter:image"]',       'content', ogImage)
    set('meta[name="robots"]', 'content', noindex ? 'noindex, nofollow' : 'index, follow')

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = fullUrl

    const schemaId = 'softcurse-page-schema'
    let schema = document.getElementById(schemaId)
    if (structuredData) {
      if (!schema) {
        schema = document.createElement('script')
        schema.id = schemaId
        schema.type = 'application/ld+json'
        document.head.appendChild(schema)
      }
      schema.textContent = JSON.stringify(structuredData)
    } else {
      schema?.remove()
    }

    return () => document.getElementById(schemaId)?.remove()
  }, [title, description, image, noindex, structuredData, type, url])
}

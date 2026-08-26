import { useEffect } from 'react'

const SITE_URL  = 'https://softcursesystems.pages.dev'
const SITE_NAME = 'Softcurse Systems'
const DEFAULT_OG = `${SITE_URL}/og-image.png`

/**
 * Sets per-page SEO — title, description, OG tags, Twitter card.
 * Call at the top of every page component.
 */
export function useSEO({ title, description, image, url, type = 'website', noindex = false }) {
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
    set('meta[name="description"]',        'content', description || 'A small, slightly sinister digital universe. Tools. Games. Systems.')

    // OG
    set('meta[property="og:title"]',       'content', fullTitle)
    set('meta[property="og:description"]', 'content', description || 'A small, slightly sinister digital universe.')
    set('meta[property="og:url"]',         'content', fullUrl)
    set('meta[property="og:image"]',       'content', ogImage)
    set('meta[property="og:image:alt"]',   'content', `${title || SITE_NAME} — ${SITE_NAME}`)
    set('meta[property="og:type"]',        'content', type)

    // Twitter
    set('meta[name="twitter:title"]',       'content', fullTitle)
    set('meta[name="twitter:description"]', 'content', description || 'A small, slightly sinister digital universe.')
    set('meta[name="twitter:image"]',       'content', ogImage)
    set('meta[name="robots"]', 'content', noindex ? 'noindex, nofollow' : 'index, follow')

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = fullUrl

  }, [title, description, image, noindex, type, url])
}

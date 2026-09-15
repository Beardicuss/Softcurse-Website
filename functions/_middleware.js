/* global HTMLRewriter */
const SITE_URL = 'https://softcursesystems.pages.dev'

const ROUTES = [
  { pattern: /^\/lab\/([^/]+)\/?$/, type: 'app', schema: 'SoftwareApplication' },
  { pattern: /^\/studio\/([^/]+)\/?$/, type: 'game', schema: 'VideoGame' },
  { pattern: /^\/experiments\/([^/]+)\/?$/, type: 'experiment', schema: 'CreativeWork' },
  { pattern: /^\/localization\/([^/]+)\/?$/, type: 'localization', schema: 'CreativeWork' },
  { pattern: /^\/chronicles\/([^/]+)\/?$/, type: 'chronicle', schema: 'Book' },
  { pattern: /^\/blog\/([^/]+)\/?$/, type: 'blog', schema: 'BlogPosting' },
]

class TitleHandler {
  constructor(value) { this.value = value }
  element(element) { element.setInnerContent(this.value) }
}

class AttributeHandler {
  constructor(attribute, value) { this.attribute = attribute; this.value = value }
  element(element) { element.setAttribute(this.attribute, this.value) }
}

class HeadHandler {
  constructor(schema) { this.schema = schema }
  element(element) {
    element.append(`<script id="softcurse-page-schema" type="application/ld+json">${JSON.stringify(this.schema).replace(/</g, '\\u003c')}</script>`, { html: true })
  }
}

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url)
  const route = ROUTES.map(entry => ({ ...entry, match: requestUrl.pathname.match(entry.pattern) })).find(entry => entry.match)
  if (!route || context.request.method !== 'GET') return context.next()

  const response = await context.next()
  if (!response.headers.get('content-type')?.includes('text/html')) return response

  try {
    const row = await context.env.CMS_DB.prepare(`
      SELECT id, title, data_json, updated_at, published_at
      FROM content_items
      WHERE type = ?1 AND slug = ?2 AND status = 'published'
    `).bind(route.type, decodeURIComponent(route.match[1])).first()
    if (!row) return response

    const data = JSON.parse(row.data_json)
    const title = `${row.title} — Softcurse Systems`
    const description = String(data.excerpt || data.shortDesc || data.desc || `Explore ${row.title} from Softcurse Systems.`).replace(/\s+/g, ' ').trim().slice(0, 200)
    const canonical = `${SITE_URL}${requestUrl.pathname.replace(/\/$/, '')}`
    const asset = await context.env.CMS_DB.prepare(`
      SELECT id FROM assets WHERE content_id = ?1 AND slot IN ('card', 'cover', 'hero')
      ORDER BY CASE slot WHEN 'card' THEN 0 WHEN 'cover' THEN 1 ELSE 2 END LIMIT 1
    `).bind(row.id).first()
    const image = asset ? `${SITE_URL}/api/assets/${asset.id}` : new URL(data.image || '/og-image.png', SITE_URL).toString()
    const schema = {
      '@context': 'https://schema.org',
      '@type': route.schema,
      name: row.title,
      headline: route.type === 'blog' ? row.title : undefined,
      description,
      url: canonical,
      image,
      datePublished: route.type === 'blog' ? (data.date || row.published_at) : undefined,
      dateModified: row.updated_at,
      author: { '@type': 'Organization', name: 'Softcurse Systems' },
    }

    return new HTMLRewriter()
      .on('title', new TitleHandler(title))
      .on('meta[name="description"]', new AttributeHandler('content', description))
      .on('meta[property="og:title"]', new AttributeHandler('content', title))
      .on('meta[property="og:description"]', new AttributeHandler('content', description))
      .on('meta[property="og:url"]', new AttributeHandler('content', canonical))
      .on('meta[property="og:image"]', new AttributeHandler('content', image))
      .on('meta[property="og:type"]', new AttributeHandler('content', route.type === 'blog' ? 'article' : 'website'))
      .on('meta[name="twitter:title"]', new AttributeHandler('content', title))
      .on('meta[name="twitter:description"]', new AttributeHandler('content', description))
      .on('meta[name="twitter:image"]', new AttributeHandler('content', image))
      .on('link[rel="canonical"]', new AttributeHandler('href', canonical))
      .on('head', new HeadHandler(schema))
      .transform(response)
  } catch (error) {
    console.error('SEO middleware failed; serving the application response.', error)
    return response
  }
}

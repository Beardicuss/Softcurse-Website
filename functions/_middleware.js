/* global HTMLRewriter */
const SITE_URL = 'https://softcursesystems.pages.dev'

const ROUTES = [
  { pattern: /^\/lab\/([^/]+)\/?$/, type: 'app', schema: 'SoftwareApplication', parentName: 'Lab', parentPath: '/lab/apps' },
  { pattern: /^\/studio\/([^/]+)\/?$/, type: 'game', schema: 'VideoGame', parentName: 'Studio Games', parentPath: '/studio/games' },
  { pattern: /^\/experiments\/([^/]+)\/?$/, type: 'experiment', schema: 'CreativeWork', parentName: 'Experiments', parentPath: '/experiments' },
  { pattern: /^\/localization\/([^/]+)\/?$/, type: 'localization', schema: 'CreativeWork', parentName: 'Localization', parentPath: '/localization' },
  { pattern: /^\/chronicles\/([^/]+)\/?$/, type: 'chronicle', schema: 'Book', parentName: 'Chronicles', parentPath: '/chronicles' },
  { pattern: /^\/blog\/([^/]+)\/?$/, type: 'blog', schema: 'BlogPosting', parentName: 'Blog', parentPath: '/blog' },
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
      SELECT c.id, c.title, c.data_json, c.updated_at, c.published_at,
        cp.sale_mode, cp.price_minor, cp.currency
      FROM content_items c
      LEFT JOIN commerce_products cp ON cp.content_id = c.id
      WHERE c.type = ?1 AND c.slug = ?2 AND c.status = 'published'
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
    const entity = {
      '@type': route.schema,
      name: row.title,
      headline: route.type === 'blog' ? row.title : undefined,
      description,
      url: canonical,
      image,
      datePublished: route.type === 'blog' ? (data.date || row.published_at) : undefined,
      dateModified: row.updated_at,
      author: { '@type': 'Organization', name: 'Softcurse Systems' },
      genre: route.type === 'chronicle' ? data.genre : undefined,
      isPartOf: route.type === 'chronicle' && data.series ? { '@type': 'BookSeries', name: data.series } : undefined,
      bookEdition: route.type === 'chronicle' ? data.book : undefined,
      applicationCategory: route.type === 'app'
        ? (String(data.tag || '').includes('SECURITY') ? 'SecurityApplication'
          : String(data.tag || '').includes('MEDIA') ? 'MultimediaApplication'
            : 'UtilitiesApplication')
        : undefined,
      operatingSystem: route.type === 'app' ? 'Windows' : undefined,
      softwareVersion: route.type === 'app' ? data.version : undefined,
      offers: route.type === 'app' ? {
        '@type': 'Offer',
        price: row.sale_mode === 'paid' && row.price_minor ? (row.price_minor / 100).toFixed(2) : '0',
        priceCurrency: row.currency || 'USD',
      } : undefined,
    }
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [entity, {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: route.parentName, item: `${SITE_URL}${route.parentPath}` },
          { '@type': 'ListItem', position: 3, name: row.title, item: canonical },
        ],
      }],
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

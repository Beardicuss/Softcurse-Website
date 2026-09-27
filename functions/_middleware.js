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

const STATIC_ROUTES = {
  '/lab': {
    title: 'Lab — Apps, Tools & Experiments | Softcurse Systems',
    description: 'Explore Softcurse applications, Windows utilities, creative tools, and experimental technology projects.',
    name: 'Lab',
  },
  '/lab/apps': {
    title: 'Apps & Tools | Softcurse Systems Lab',
    description: 'Browse Softcurse Windows applications, media tools, system utilities, and productivity software.',
    name: 'Apps & Tools',
    parentName: 'Lab',
    parentPath: '/lab',
  },
  '/experiments': {
    title: 'Experiments | Softcurse Systems',
    description: 'Discover experimental Softcurse software, prototypes, and technology explorations.',
    name: 'Experiments',
  },
  '/studio': {
    title: 'Studio — Games & Interactive Worlds | Softcurse Systems',
    description: 'Explore Softcurse games, interactive fiction, browser experiences, and works in development.',
    name: 'Studio',
  },
  '/studio/games': {
    title: 'Games | Softcurse Systems Studio',
    description: 'Browse released and in-development games from Softcurse Systems Studio.',
    name: 'Games',
    parentName: 'Studio',
    parentPath: '/studio',
  },
  '/chronicles': {
    title: 'Chronicles — Stories & Fiction | Softcurse Systems',
    description: 'Read original Softcurse Chronicles, serialized stories, chapters, and fictional worlds.',
    name: 'Chronicles',
  },
  '/localization': {
    title: 'Localization Projects | Softcurse Systems',
    description: 'Explore Softcurse localization and Georgian translation projects for games and software.',
    name: 'Localization',
  },
  '/about': {
    title: 'About Softcurse Systems',
    description: 'Learn about Softcurse Systems and its work across focused software, experimental technology, games, and storytelling.',
    name: 'About',
  },
  '/contact': {
    title: 'Contact | Softcurse Systems',
    description: 'Contact Softcurse Systems about its applications, games, projects, or collaborations.',
    name: 'Contact',
  },
  '/blog': {
    title: 'Blog — Development Notes & Releases | Softcurse Systems',
    description: 'Read Softcurse development notes, release announcements, project updates, and behind-the-scenes articles.',
    name: 'Blog',
  },
  '/roadmap': {
    title: 'Roadmap | Softcurse Systems',
    description: 'Follow the current development status and upcoming milestones for Softcurse applications, games, and projects.',
    name: 'Roadmap',
  },
  '/press': {
    title: 'Press Kit | Softcurse Systems',
    description: 'Access official Softcurse Systems descriptions, brand information, and press resources.',
    name: 'Press Kit',
  },
}

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
  const normalizedPath = requestUrl.pathname === '/' ? '/' : requestUrl.pathname.replace(/\/$/, '')
  const staticRoute = STATIC_ROUTES[normalizedPath]
  if ((!route && !staticRoute) || context.request.method !== 'GET') return context.next()

  const response = await context.next()
  if (!response.headers.get('content-type')?.includes('text/html')) return response

  if (staticRoute) {
    const canonical = `${SITE_URL}${normalizedPath}`
    const breadcrumbs = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    ]
    if (staticRoute.parentPath) {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: 2,
        name: staticRoute.parentName,
        item: `${SITE_URL}${staticRoute.parentPath}`,
      })
    }
    breadcrumbs.push({
      '@type': 'ListItem',
      position: breadcrumbs.length + 1,
      name: staticRoute.name,
      item: canonical,
    })
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [{
        '@type': 'CollectionPage',
        name: staticRoute.name,
        description: staticRoute.description,
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'Softcurse Systems', url: `${SITE_URL}/` },
      }, {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs,
      }],
    }

    return new HTMLRewriter()
      .on('title', new TitleHandler(staticRoute.title))
      .on('meta[name="description"]', new AttributeHandler('content', staticRoute.description))
      .on('meta[property="og:title"]', new AttributeHandler('content', staticRoute.title))
      .on('meta[property="og:description"]', new AttributeHandler('content', staticRoute.description))
      .on('meta[property="og:url"]', new AttributeHandler('content', canonical))
      .on('meta[property="og:type"]', new AttributeHandler('content', 'website'))
      .on('meta[name="twitter:title"]', new AttributeHandler('content', staticRoute.title))
      .on('meta[name="twitter:description"]', new AttributeHandler('content', staticRoute.description))
      .on('link[rel="canonical"]', new AttributeHandler('href', canonical))
      .on('head', new HeadHandler(schema))
      .transform(response)
  }

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
      inLanguage: route.type === 'chronicle' ? 'en' : undefined,
      encodingFormat: route.type === 'chronicle' ? 'text/html' : undefined,
      isAccessibleForFree: route.type === 'chronicle' ? (data.chapters || []).some(chapter => chapter.status === 'published') : undefined,
      hasPart: route.type === 'chronicle' ? (data.chapters || [])
        .filter(chapter => chapter.status === 'published')
        .map(chapter => ({
          '@type': 'Chapter',
          name: chapter.title,
          position: chapter.num,
          url: `${canonical}/chapter/${chapter.num}`,
          inLanguage: 'en',
          isAccessibleForFree: true,
        })) : undefined,
      publisher: route.type === 'chronicle' ? { '@type': 'Organization', name: 'Softcurse Systems' } : undefined,
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

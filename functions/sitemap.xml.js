const SITE_URL = 'https://softcursesystems.pages.dev'

const CORE_ROUTES = [
  ['/', '1.0'],
  ['/lab', '0.9'],
  ['/lab/apps', '0.8'],
  ['/experiments', '0.7'],
  ['/studio', '0.9'],
  ['/studio/games', '0.8'],
  ['/chronicles', '0.8'],
  ['/localization', '0.7'],
  ['/about', '0.6'],
  ['/contact', '0.6'],
  ['/blog', '0.8'],
  ['/roadmap', '0.7'],
  ['/press', '0.5'],
]

const TYPE_ROUTES = {
  game: slug => `/studio/${slug}`,
  app: slug => `/lab/${slug}`,
  experiment: slug => `/experiments/${slug}`,
  localization: slug => `/localization/${slug}`,
  chronicle: slug => `/chronicles/${slug}`,
  blog: slug => `/blog/${slug}`,
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, character => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  })[character])
}

export async function onRequestGet(context) {
  const routes = new Map(CORE_ROUTES.map(([path, priority]) => [path, { priority }]))

  try {
    const { results = [] } = await context.env.CMS_DB.prepare(`
      SELECT type, slug, data_json, updated_at
      FROM content_items
      WHERE status = 'published'
      ORDER BY type, sort_order, updated_at DESC
    `).all()

    for (const row of results) {
      const buildRoute = TYPE_ROUTES[row.type]
      if (!buildRoute) continue
      const path = buildRoute(row.slug)
      const lastmod = row.updated_at ? String(row.updated_at).slice(0, 10) : undefined
      routes.set(path, { priority: row.type === 'game' ? '0.8' : '0.7', lastmod })

      if (row.type === 'chronicle') {
        let data = {}
        try { data = JSON.parse(row.data_json) } catch { /* malformed optional chapter metadata */ }
        for (const chapter of data.chapters || []) {
          if (chapter.status !== 'published' || !chapter.num) continue
          routes.set(`${path}/chapter/${chapter.num}`, { priority: '0.6', lastmod })
        }
      }
    }
  } catch (error) {
    console.error('Sitemap CMS query failed; serving core routes.', error)
  }

  const urls = [...routes.entries()].map(([path, metadata]) => {
    const lastmod = metadata.lastmod ? `<lastmod>${escapeXml(metadata.lastmod)}</lastmod>` : ''
    return `  <url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${lastmod}<priority>${metadata.priority}</priority></url>`
  }).join('\n')

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

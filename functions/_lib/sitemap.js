export const SITE_URL = 'https://softcursesystems.pages.dev'

const CORE_ROUTES = [
  ['/', '1.0'],
  ['/lab', '0.9'],
  ['/lab/apps', '0.8'],
  ['/experiments', '0.7'],
  ['/studio', '0.9'],
  ['/studio/games', '0.8'],
  ['/studio/hexbrewers/rulebook', '0.7'],
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

export async function getSitemapRoutes(context) {
  const routes = new Map(CORE_ROUTES.map(([path, priority]) => [path, { priority }]))

  try {
    const seoRow = await context.env.CMS_DB.prepare("SELECT value_json FROM settings WHERE key = 'seo'").first()
    const seo = seoRow ? JSON.parse(seoRow.value_json) : { sitemapEnabled: true, excludedPaths: [] }
    if (seo.sitemapEnabled === false) return new Map()
    const excluded = seo.excludedPaths || []
    for (const path of [...routes.keys()]) if (excluded.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) routes.delete(path)
    const { results = [] } = await context.env.CMS_DB.prepare(`
      SELECT type, slug, updated_at
      FROM content_items
      WHERE status = 'published'
      ORDER BY type, sort_order, updated_at DESC
    `).all()

    for (const row of results) {
      const buildRoute = TYPE_ROUTES[row.type]
      if (!buildRoute) continue
      const path = buildRoute(row.slug)
      if (excluded.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) continue
      const lastmod = row.updated_at ? String(row.updated_at).slice(0, 10) : undefined
      routes.set(path, { priority: row.type === 'game' ? '0.8' : '0.7', lastmod })
    }

    const chapters = await context.env.CMS_DB.prepare(`
      SELECT c.slug, ch.chapter_number, ch.updated_at
      FROM chronicle_chapters ch JOIN content_items c ON c.id = ch.content_id
      WHERE c.status = 'published' AND ch.status = 'published'
      ORDER BY c.slug, ch.sort_order, ch.chapter_number
    `).all()

    for (const chapter of chapters.results) {
      const chapterPath = `/chronicles/${chapter.slug}/chapter/${chapter.chapter_number}`
      if (excluded.some(prefix => chapterPath === prefix || chapterPath.startsWith(`${prefix}/`))) continue
      routes.set(chapterPath, {
        priority: '0.6',
        lastmod: chapter.updated_at ? String(chapter.updated_at).slice(0, 10) : undefined,
      })
    }
  } catch (error) {
    console.error('Sitemap CMS query failed; serving core routes.', error)
  }

  return routes
}

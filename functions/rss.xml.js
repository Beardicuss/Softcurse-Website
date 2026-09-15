const SITE_URL = 'https://softcursesystems.pages.dev'

function escapeXml(value = '') {
  return String(value).replace(/[<>&'"]/g, character => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  })[character])
}

function asRfc822(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString()
}

export async function onRequestGet(context) {
  let posts = []
  try {
    const result = await context.env.CMS_DB.prepare(`
      SELECT slug, title, data_json, published_at, updated_at
      FROM content_items
      WHERE type = 'blog' AND status = 'published'
      ORDER BY COALESCE(json_extract(data_json, '$.date'), published_at) DESC
      LIMIT 30
    `).all()
    posts = result.results
  } catch (error) {
    console.error('RSS CMS query failed.', error)
  }

  const items = posts.map(row => {
    const data = JSON.parse(row.data_json)
    const link = `${SITE_URL}/blog/${row.slug}`
    return `    <item>
      <title>${escapeXml(row.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(data.excerpt)}</description>
      <category>${escapeXml(data.category)}</category>
      <pubDate>${escapeXml(asRfc822(data.date || row.published_at || row.updated_at))}</pubDate>
    </item>`
  }).join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Softcurse Systems Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Release notes, development dispatches, and engineering notes from Softcurse Systems.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

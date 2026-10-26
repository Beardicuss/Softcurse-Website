export async function onRequestGet(context) {
  let settings = { robotsIndex: true, sitemapEnabled: true, excludedPaths: [] }
  try {
    const row = await context.env.CMS_DB.prepare("SELECT value_json FROM settings WHERE key = 'seo'").first()
    if (row) settings = { ...settings, ...JSON.parse(row.value_json) }
  } catch { /* serve safe defaults before migration */ }
  const lines = ['User-agent: *']
  if (!settings.robotsIndex) lines.push('Disallow: /')
  else {
    lines.push('Allow: /', 'Disallow: /admin', 'Disallow: /api/admin')
    for (const path of settings.excludedPaths || []) lines.push(`Disallow: ${path}`)
  }
  if (settings.sitemapEnabled) lines.push('', 'Sitemap: https://softcursesystems.pages.dev/sitemap.xml')
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' } })
}

import { getSitemapRoutes, SITE_URL } from './_lib/sitemap.js'

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, character => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  })[character])
}

export async function onRequestGet(context) {
  const routes = await getSitemapRoutes(context)

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

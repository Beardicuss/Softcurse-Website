import { getSitemapRoutes, SITE_URL } from './_lib/sitemap.js'

export async function onRequestGet(context) {
  const routes = await getSitemapRoutes(context)
  const urls = [...routes.keys()].map(path => `${SITE_URL}${path}`).join('\n')

  return new Response(`${urls}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

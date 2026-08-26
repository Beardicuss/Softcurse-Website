export async function onRequestGet(context) {
  const asset = await context.env.CMS_DB.prepare(`
    SELECT a.r2_key, a.mime_type, a.sha256
    FROM assets a JOIN content_items c ON c.id = a.content_id
    WHERE a.id = ?1 AND c.status = 'published'
  `).bind(context.params.id).first()
  if (!asset) return new Response('Not found', { status: 404 })
  const object = await context.env.CMS_ASSETS.get(asset.r2_key)
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('X-Content-Type-Options', 'nosniff')
  return new Response(object.body, { headers })
}

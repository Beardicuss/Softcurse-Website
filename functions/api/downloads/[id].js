function contentDisposition(fileName) {
  const safe = String(fileName || 'download').replace(/["\\\r\n]/g, '_')
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '')
  if (!match) return null
  let start = match[1] ? Number(match[1]) : null
  let end = match[2] ? Number(match[2]) : null
  if (start === null && end !== null) {
    start = Math.max(0, size - end)
    end = size - 1
  } else {
    end = end === null ? size - 1 : Math.min(end, size - 1)
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) return false
  return { offset: start, length: end - start + 1, start, end }
}

async function serve(context, includeBody) {
  const release = await context.env.CMS_DB.prepare(`
    SELECT r.* FROM releases r JOIN content_items c ON c.id = r.content_id
    WHERE r.id = ?1 AND r.kind = 'file' AND r.status = 'published' AND c.status = 'published'
  `).bind(context.params.id).first()
  if (!release) return new Response('Not found', { status: 404 })
  const range = parseRange(context.request.headers.get('range'), release.size_bytes)
  if (range === false) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${release.size_bytes}` } })
  const object = includeBody
    ? await context.env.CMS_ASSETS.get(release.r2_key, range ? { range: { offset: range.offset, length: range.length } } : undefined)
    : await context.env.CMS_ASSETS.head(release.r2_key)
  if (!object) return new Response('Not found', { status: 404 })
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Content-Disposition', contentDisposition(release.file_name))
  headers.set('Content-Type', release.mime_type || 'application/octet-stream')
  headers.set('Accept-Ranges', 'bytes')
  headers.set('ETag', object.httpEtag)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Cache-Control', 'private, no-store')
  if (range) {
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${release.size_bytes}`)
    headers.set('Content-Length', String(range.length))
  } else {
    headers.set('Content-Length', String(release.size_bytes))
  }
  if (includeBody) context.waitUntil(context.env.CMS_DB.prepare('UPDATE releases SET download_count = download_count + 1 WHERE id = ?1').bind(release.id).run())
  return new Response(includeBody ? object.body : null, { status: range ? 206 : 200, headers })
}

export function onRequestGet(context) { return serve(context, true) }
export function onRequestHead(context) { return serve(context, false) }

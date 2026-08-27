import { sha256Hex } from '../../_lib/cms.js'

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

async function findAuthorizedRelease(env, tokenHash) {
  return env.CMS_DB.prepare(`
    SELECT r.* FROM download_tokens d
    JOIN entitlements e ON e.id = d.entitlement_id
    JOIN releases r ON r.id = d.release_id AND r.content_id = e.content_id
    JOIN content_items c ON c.id = r.content_id
    WHERE d.token_hash = ?1 AND d.revoked_at IS NULL AND d.expires_at > CURRENT_TIMESTAMP
      AND d.use_count < d.max_uses AND e.status = 'active'
      AND (e.expires_at IS NULL OR e.expires_at > CURRENT_TIMESTAMP)
      AND r.kind = 'file' AND r.status = 'published' AND c.status = 'published'
  `).bind(tokenHash).first()
}

async function reserveUse(env, tokenHash) {
  const result = await env.CMS_DB.prepare(`
    UPDATE download_tokens SET use_count = use_count + 1
    WHERE token_hash = ?1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP AND use_count < max_uses
      AND EXISTS (
        SELECT 1 FROM entitlements e JOIN releases r ON r.id = download_tokens.release_id
        JOIN content_items c ON c.id = r.content_id
        WHERE e.id = download_tokens.entitlement_id AND e.content_id = r.content_id
          AND e.status = 'active' AND (e.expires_at IS NULL OR e.expires_at > CURRENT_TIMESTAMP)
          AND r.kind = 'file' AND r.status = 'published' AND c.status = 'published'
      )
  `).bind(tokenHash).run()
  return Number(result.meta?.changes || 0) === 1
}

async function serve(context, includeBody) {
  const rawToken = String(context.params.token || '')
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(rawToken)) return new Response('Not found', { status: 404 })
  const tokenHash = await sha256Hex(rawToken)
  const release = await findAuthorizedRelease(context.env, tokenHash)
  if (!release) return new Response('Not found', { status: 404 })
  const range = parseRange(context.request.headers.get('range'), release.size_bytes)
  if (range === false) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${release.size_bytes}` } })
  if (includeBody && !(await reserveUse(context.env, tokenHash))) return new Response('Not found', { status: 404 })

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

import {
  apiError,
  ASSET_SPECS,
  CmsError,
  handleCmsError,
  json,
  readBinary,
  sanitizeFileName,
  sha256Hex,
  writeAudit,
} from '../../../_lib/cms.js'

export async function onRequestGet(context) {
  const contentId = new URL(context.request.url).searchParams.get('contentId')
  if (!contentId) return apiError(400, 'contentId is required.', 'CONTENT_ID_REQUIRED')
  const rows = await context.env.CMS_DB.prepare('SELECT * FROM assets WHERE content_id = ?1 ORDER BY slot').bind(contentId).all()
  return json({ ok: true, assets: rows.results.map(asset => ({ ...asset, url: `/api/assets/${asset.id}` })) })
}

export async function onRequestPost(context) {
  try {
    const contentId = context.request.headers.get('x-content-id')
    const slot = context.request.headers.get('x-asset-slot')
    const originalName = sanitizeFileName(context.request.headers.get('x-file-name'))
    const width = Number(context.request.headers.get('x-image-width'))
    const height = Number(context.request.headers.get('x-image-height'))
    if (!contentId || !slot) throw new CmsError(400, 'Content and asset slot are required.', 'ASSET_METADATA_REQUIRED')

    const content = await context.env.CMS_DB.prepare('SELECT id, type FROM content_items WHERE id = ?1').bind(contentId).first()
    if (!content) throw new CmsError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')
    const spec = ASSET_SPECS[content.type]?.[slot]
    if (!spec) throw new CmsError(400, 'That asset slot is not valid for this content type.', 'INVALID_ASSET_SLOT')
    if (width !== spec.width || height !== spec.height) {
      throw new CmsError(400, `This slot requires exactly ${spec.width} × ${spec.height} pixels.`, 'INVALID_ASSET_DIMENSIONS', spec)
    }
    if (context.request.headers.get('content-type') !== 'image/webp') {
      throw new CmsError(415, 'Assets must be prepared as WebP images.', 'INVALID_ASSET_FORMAT')
    }

    const maxBytes = Number(context.env.CMS_MAX_IMAGE_BYTES || 8388608)
    const bytes = await readBinary(context.request, maxBytes)
    const signature = new TextDecoder().decode(bytes.slice(0, 4)) + new TextDecoder().decode(bytes.slice(8, 12))
    if (signature !== 'RIFFWEBP') throw new CmsError(415, 'The uploaded data is not a valid WebP file.', 'INVALID_ASSET_FORMAT')

    const id = crypto.randomUUID()
    const r2Key = `assets/${content.type}/${contentId}/${slot}-${id}.webp`
    const digest = await sha256Hex(bytes)
    const existing = await context.env.CMS_DB.prepare('SELECT id, r2_key FROM assets WHERE content_id = ?1 AND slot = ?2').bind(contentId, slot).first()

    await context.env.CMS_ASSETS.put(r2Key, bytes, {
      httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { contentId, slot, sha256: digest },
    })

    try {
      if (existing) {
        await context.env.CMS_DB.prepare(`
          UPDATE assets SET id = ?1, r2_key = ?2, original_name = ?3, mime_type = 'image/webp',
            width = ?4, height = ?5, size_bytes = ?6, sha256 = ?7, created_by = ?8, created_at = CURRENT_TIMESTAMP
          WHERE content_id = ?9 AND slot = ?10
        `).bind(id, r2Key, originalName, width, height, bytes.byteLength, digest, context.data.admin.username, contentId, slot).run()
      } else {
        await context.env.CMS_DB.prepare(`
          INSERT INTO assets (id, content_id, slot, r2_key, original_name, mime_type, width, height, size_bytes, sha256, created_by)
          VALUES (?1, ?2, ?3, ?4, ?5, 'image/webp', ?6, ?7, ?8, ?9, ?10)
        `).bind(id, contentId, slot, r2Key, originalName, width, height, bytes.byteLength, digest, context.data.admin.username).run()
      }
    } catch (error) {
      await context.env.CMS_ASSETS.delete(r2Key)
      throw error
    }

    if (existing) context.waitUntil(context.env.CMS_ASSETS.delete(existing.r2_key))
    await writeAudit(context.env, context.data.admin.username, existing ? 'replace_asset' : 'add_asset', 'asset', id, { contentId, slot })
    return json({ ok: true, asset: { id, contentId, slot, width, height, sizeBytes: bytes.byteLength, sha256: digest, url: `/api/assets/${id}` } }, { status: 201 })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

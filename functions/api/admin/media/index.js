import { CmsError, handleCmsError, json, readBinary, sanitizeFileName, sha256Hex, writeAudit } from '../../../_lib/cms.js'

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv', 'application/json',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'video/mp4', 'video/webm',
])

function typeGroup(mimeType) {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const query = String(url.searchParams.get('q') || '').trim().slice(0, 100)
  const folder = url.searchParams.get('folder')
  const group = url.searchParams.get('type')
  const clauses = []
  const values = []
  if (query) { clauses.push(`(m.display_name LIKE ?${values.length + 1} OR m.original_name LIKE ?${values.length + 1} OR m.alt_text LIKE ?${values.length + 1})`); values.push(`%${query}%`) }
  if (folder === 'root') clauses.push('m.folder_id IS NULL')
  else if (folder) { values.push(folder); clauses.push(`m.folder_id = ?${values.length}`) }
  if (group && ['image', 'audio', 'video', 'document'].includes(group)) {
    if (group === 'document') clauses.push("m.mime_type NOT LIKE 'image/%' AND m.mime_type NOT LIKE 'audio/%' AND m.mime_type NOT LIKE 'video/%'")
    else { values.push(`${group}/%`); clauses.push(`m.mime_type LIKE ?${values.length}`) }
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const [items, folders, legacy] = await context.env.CMS_DB.batch([
    context.env.CMS_DB.prepare(`SELECT m.*, f.name AS folder_name, COUNT(u.media_id) AS usage_count FROM media_items m LEFT JOIN media_folders f ON f.id = m.folder_id LEFT JOIN media_usage u ON u.media_id = m.id ${where} GROUP BY m.id ORDER BY m.updated_at DESC LIMIT 250`).bind(...values),
    context.env.CMS_DB.prepare('SELECT f.*, COUNT(m.id) AS item_count FROM media_folders f LEFT JOIN media_items m ON m.folder_id = f.id GROUP BY f.id ORDER BY f.name'),
    context.env.CMS_DB.prepare(`SELECT a.id, a.original_name, a.mime_type, a.width, a.height, a.size_bytes, a.sha256, a.created_at, a.slot, c.id AS content_id, c.title AS content_title, c.type AS content_type FROM assets a JOIN content_items c ON c.id = a.content_id ORDER BY a.created_at DESC`),
  ])
  return json({
    ok: true,
    folders: folders.results.map(row => ({ ...row, item_count: Number(row.item_count) })),
    items: items.results.map(row => ({ ...row, kind: 'library', type_group: typeGroup(row.mime_type), usage_count: Number(row.usage_count), url: `/api/admin/media/${row.id}` })),
    usedAssets: legacy.results.map(row => ({ ...row, kind: 'attached', type_group: 'image', usage_count: 1, url: `/api/assets/${row.id}` })),
  })
}

export async function onRequestPost(context) {
  try {
    const originalName = sanitizeFileName(context.request.headers.get('x-file-name'))
    const displayName = String(context.request.headers.get('x-display-name') || originalName).trim().slice(0, 160)
    const altText = String(context.request.headers.get('x-alt-text') || '').trim().slice(0, 500)
    const folderId = context.request.headers.get('x-folder-id') || null
    const mimeType = String(context.request.headers.get('content-type') || '').split(';')[0].toLowerCase()
    const width = Number(context.request.headers.get('x-image-width')) || null
    const height = Number(context.request.headers.get('x-image-height')) || null
    if (!ALLOWED_TYPES.has(mimeType)) throw new CmsError(415, 'That file type is not supported by the media library.', 'UNSUPPORTED_MEDIA_TYPE')
    if (!displayName) throw new CmsError(400, 'A display name is required.', 'MEDIA_NAME_REQUIRED')
    if (folderId) {
      const folder = await context.env.CMS_DB.prepare('SELECT id FROM media_folders WHERE id = ?1').bind(folderId).first()
      if (!folder) throw new CmsError(404, 'Folder not found.', 'MEDIA_FOLDER_NOT_FOUND')
    }
    const maxBytes = Math.min(50 * 1024 * 1024, Number(context.env.CMS_MAX_MEDIA_BYTES || 25 * 1024 * 1024))
    const bytes = await readBinary(context.request, maxBytes)
    if (!bytes.byteLength) throw new CmsError(400, 'The uploaded file is empty.', 'EMPTY_MEDIA_FILE')
    const id = crypto.randomUUID()
    const extension = originalName.includes('.') ? `.${originalName.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}` : ''
    const r2Key = `media/${new Date().toISOString().slice(0, 7)}/${id}${extension}`
    const digest = await sha256Hex(bytes)
    await context.env.CMS_ASSETS.put(r2Key, bytes, { httpMetadata: { contentType: mimeType, cacheControl: 'private, max-age=3600' }, customMetadata: { sha256: digest, uploadedBy: context.data.admin.username } })
    try {
      await context.env.CMS_DB.prepare(`INSERT INTO media_items (id, folder_id, r2_key, original_name, display_name, alt_text, mime_type, size_bytes, width, height, sha256, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`).bind(id, folderId, r2Key, originalName, displayName, altText, mimeType, bytes.byteLength, width, height, digest, context.data.admin.username).run()
    } catch (error) { await context.env.CMS_ASSETS.delete(r2Key); throw error }
    await writeAudit(context.env, context.data.admin.username, 'upload_media', 'media', id, { originalName, mimeType, sizeBytes: bytes.byteLength })
    return json({ ok: true, item: { id, displayName, mimeType, sizeBytes: bytes.byteLength, url: `/api/admin/media/${id}` } }, { status: 201 })
  } catch (error) { return handleCmsError(error, context.request) }
}

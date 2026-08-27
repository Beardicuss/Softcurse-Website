import { CmsError, handleCmsError, json, readJson, RELEASE_CHANNELS, sanitizeFileName, writeAudit } from '../../../_lib/cms.js'

const ALLOWED_EXTENSIONS = new Set(['exe', 'msi', 'zip', '7z', 'rar', 'apk', 'dmg', 'pkg', 'appimage', 'deb', 'rpm', 'pdf', 'epub'])

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request)
    const content = await context.env.CMS_DB.prepare('SELECT id, type FROM content_items WHERE id = ?1').bind(payload.contentId).first()
    if (!content) throw new CmsError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')
    const fileName = sanitizeFileName(payload.fileName)
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(extension)) throw new CmsError(415, 'That installer or download file type is not allowed.', 'FILE_TYPE_NOT_ALLOWED')
    const sizeBytes = Number(payload.sizeBytes)
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > 5 * 1024 ** 4) throw new CmsError(400, 'Invalid file size.', 'INVALID_FILE_SIZE')
    if (typeof payload.label !== 'string' || !payload.label.trim()) throw new CmsError(400, 'A release label is required.', 'INVALID_RELEASE_LABEL')
    const id = crypto.randomUUID()
    const r2Key = `releases/${content.type}/${payload.contentId}/${id}/${fileName}`
    const multipart = await context.env.CMS_ASSETS.createMultipartUpload(r2Key, {
      httpMetadata: { contentType: payload.mimeType || 'application/octet-stream', contentDisposition: `attachment; filename="${fileName}"` },
      customMetadata: { contentId: payload.contentId, uploadedBy: context.data.admin.username },
    })
    const partSize = Math.max(5 * 1024 * 1024, Number(context.env.CMS_UPLOAD_PART_BYTES || 8388608))
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const channel = payload.channel || 'stable'
    if (!RELEASE_CHANNELS.has(channel)) throw new CmsError(400, 'Invalid release channel.', 'INVALID_RELEASE_CHANNEL')
    const releaseData = {
      label: payload.label.trim(), version: payload.version || null, platform: payload.platform || 'other',
      architecture: payload.architecture || null, releaseNotes: payload.releaseNotes || null,
      channel,
      status: payload.status === 'published' ? 'published' : 'draft', isPrimary: Boolean(payload.isPrimary),
      sortOrder: Number(payload.sortOrder || 0), sha256: /^[a-f0-9]{64}$/i.test(payload.sha256 || '') ? payload.sha256.toLowerCase() : null,
    }
    await context.env.CMS_DB.prepare(`
      INSERT INTO upload_sessions (id, content_id, r2_key, r2_upload_id, file_name, mime_type, size_bytes,
        part_size, release_json, created_by, expires_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
    `).bind(id, payload.contentId, r2Key, multipart.uploadId, fileName, payload.mimeType || 'application/octet-stream',
      sizeBytes, partSize, JSON.stringify(releaseData), context.data.admin.username, expiresAt).run()
    await writeAudit(context.env, context.data.admin.username, 'begin_file_upload', 'upload', id, { contentId: payload.contentId, fileName, sizeBytes })
    return json({ ok: true, uploadId: id, partSize, expiresAt }, { status: 201 })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

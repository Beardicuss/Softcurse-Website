import { apiError, CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'
import { syncRoadmapSafely } from '../../../_lib/roadmap.js'

async function loadUpload(context) {
  return context.env.CMS_DB.prepare(`SELECT * FROM upload_sessions WHERE id = ?1 AND created_by = ?2`).bind(context.params.id, context.data.admin.username).first()
}

export async function onRequestPut(context) {
  try {
    const upload = await loadUpload(context)
    if (!upload || upload.status !== 'active') return apiError(404, 'Active upload not found.', 'UPLOAD_NOT_FOUND')
    if (new Date(upload.expires_at) <= new Date()) throw new CmsError(410, 'This upload has expired.', 'UPLOAD_EXPIRED')
    const partNumber = Number(new URL(context.request.url).searchParams.get('part'))
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) throw new CmsError(400, 'Invalid part number.', 'INVALID_PART_NUMBER')
    const declaredLength = Number(context.request.headers.get('content-length') || 0)
    if (!declaredLength || declaredLength > upload.part_size) throw new CmsError(413, 'This upload part has an invalid size.', 'INVALID_PART_SIZE')
    const multipart = context.env.CMS_ASSETS.resumeMultipartUpload(upload.r2_key, upload.r2_upload_id)
    const uploadedPart = await multipart.uploadPart(partNumber, context.request.body)
    return json({ ok: true, partNumber: uploadedPart.partNumber, etag: uploadedPart.etag })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export async function onRequestPost(context) {
  try {
    const upload = await loadUpload(context)
    if (!upload || upload.status !== 'active') return apiError(404, 'Active upload not found.', 'UPLOAD_NOT_FOUND')
    const payload = await readJson(context.request, 1048576)
    if (!Array.isArray(payload.parts) || !payload.parts.length || payload.parts.length > 10000) throw new CmsError(400, 'Uploaded parts are required.', 'PARTS_REQUIRED')
    const parts = payload.parts.map(part => ({ partNumber: Number(part.partNumber), etag: String(part.etag || '') }))
    if (parts.some(part => !Number.isInteger(part.partNumber) || part.partNumber < 1 || !part.etag)) throw new CmsError(400, 'Uploaded part data is invalid.', 'INVALID_PARTS')
    const multipart = context.env.CMS_ASSETS.resumeMultipartUpload(upload.r2_key, upload.r2_upload_id)
    await multipart.complete(parts)
    const release = JSON.parse(upload.release_json)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const statements = []
    if (release.isPrimary) statements.push(context.env.CMS_DB.prepare("UPDATE releases SET is_primary = 0 WHERE content_id = ?1 AND action_role = 'download'").bind(upload.content_id))
    statements.push(context.env.CMS_DB.prepare(`
      INSERT INTO releases (id, content_id, kind, action_role, provider, label, version, channel,
        platform, architecture, r2_key, file_name, mime_type, size_bytes, sha256, release_notes,
        status, is_primary, sort_order, created_by, created_at, updated_at, published_at)
      VALUES (?1, ?2, 'file', 'download', 'softcurse', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
        ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?18, ?19)
    `).bind(id, upload.content_id, release.label, release.version, release.channel || 'stable', release.platform,
      release.architecture, upload.r2_key, upload.file_name, upload.mime_type, upload.size_bytes,
      release.sha256, release.releaseNotes, release.status, release.isPrimary ? 1 : 0, release.sortOrder,
      context.data.admin.username, now, release.status === 'published' ? now : null))
    statements.push(context.env.CMS_DB.prepare(`UPDATE upload_sessions SET status = 'completed' WHERE id = ?1`).bind(upload.id))
    await context.env.CMS_DB.batch(statements)
    await writeAudit(context.env, context.data.admin.username, 'complete_file_upload', 'release', id, { contentId: upload.content_id, fileName: upload.file_name })
    const roadmapSync = await syncRoadmapSafely(context.env, context.data.admin.username, upload.content_id)
    return json({ ok: true, releaseId: id, roadmapSync }, { status: 201 })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export async function onRequestDelete(context) {
  try {
    const upload = await loadUpload(context)
    if (!upload || upload.status !== 'active') return apiError(404, 'Active upload not found.', 'UPLOAD_NOT_FOUND')
    const multipart = context.env.CMS_ASSETS.resumeMultipartUpload(upload.r2_key, upload.r2_upload_id)
    await multipart.abort()
    await context.env.CMS_DB.prepare(`UPDATE upload_sessions SET status = 'aborted' WHERE id = ?1`).bind(upload.id).run()
    await writeAudit(context.env, context.data.admin.username, 'abort_file_upload', 'upload', upload.id)
    return json({ ok: true, aborted: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

import { apiError, CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

export async function onRequestGet(context) {
  const item = await context.env.CMS_DB.prepare('SELECT * FROM media_items WHERE id = ?1').bind(context.params.id).first()
  if (!item) return apiError(404, 'Media item not found.', 'MEDIA_NOT_FOUND')
  const object = await context.env.CMS_ASSETS.get(item.r2_key)
  if (!object) return apiError(404, 'Stored media file not found.', 'MEDIA_OBJECT_NOT_FOUND')
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Content-Type', item.mime_type)
  headers.set('Content-Length', String(item.size_bytes))
  headers.set('ETag', `"${item.sha256}"`)
  headers.set('Content-Disposition', `inline; filename="${item.original_name.replace(/["\\]/g, '_')}"`)
  headers.set('Cache-Control', 'private, max-age=3600')
  return new Response(object.body, { headers })
}

export async function onRequestPatch(context) {
  try {
    const item = await context.env.CMS_DB.prepare('SELECT * FROM media_items WHERE id = ?1').bind(context.params.id).first()
    if (!item) return apiError(404, 'Media item not found.', 'MEDIA_NOT_FOUND')
    const body = await readJson(context.request, 4096)
    const displayName = String(body.displayName ?? item.display_name).trim().slice(0, 160)
    const altText = String(body.altText ?? item.alt_text).trim().slice(0, 500)
    const folderId = body.folderId === '' ? null : body.folderId ?? item.folder_id
    if (!displayName) throw new CmsError(400, 'A display name is required.', 'MEDIA_NAME_REQUIRED')
    if (folderId) {
      const folder = await context.env.CMS_DB.prepare('SELECT id FROM media_folders WHERE id = ?1').bind(folderId).first()
      if (!folder) throw new CmsError(404, 'Folder not found.', 'MEDIA_FOLDER_NOT_FOUND')
    }
    await context.env.CMS_DB.prepare('UPDATE media_items SET display_name = ?1, alt_text = ?2, folder_id = ?3, updated_at = CURRENT_TIMESTAMP WHERE id = ?4').bind(displayName, altText, folderId, item.id).run()
    await writeAudit(context.env, context.data.admin.username, 'update_media', 'media', item.id, { folderId })
    return json({ ok: true, updated: true })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestDelete(context) {
  try {
    const item = await context.env.CMS_DB.prepare('SELECT m.*, COUNT(u.media_id) AS usage_count FROM media_items m LEFT JOIN media_usage u ON u.media_id = m.id WHERE m.id = ?1 GROUP BY m.id').bind(context.params.id).first()
    if (!item) return apiError(404, 'Media item not found.', 'MEDIA_NOT_FOUND')
    if (Number(item.usage_count)) throw new CmsError(409, 'This file is in use. Remove its content references before deleting it.', 'MEDIA_IN_USE')
    await context.env.CMS_DB.prepare('DELETE FROM media_items WHERE id = ?1').bind(item.id).run()
    await context.env.CMS_ASSETS.delete(item.r2_key)
    await writeAudit(context.env, context.data.admin.username, 'delete_media', 'media', item.id, { originalName: item.original_name })
    return json({ ok: true, deleted: true })
  } catch (error) { return handleCmsError(error, context.request) }
}

import { apiError, CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

export async function onRequestPatch(context) {
  try {
    const body = await readJson(context.request, 2048)
    const name = String(body.name || '').trim().replace(/[\\/]/g, '-').slice(0, 80)
    if (!name) throw new CmsError(400, 'Folder name is required.', 'MEDIA_FOLDER_NAME_REQUIRED')
    const result = await context.env.CMS_DB.prepare('UPDATE media_folders SET name = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2').bind(name, context.params.id).run()
    if (!result.meta.changes) return apiError(404, 'Folder not found.', 'MEDIA_FOLDER_NOT_FOUND')
    await writeAudit(context.env, context.data.admin.username, 'rename_media_folder', 'media_folder', context.params.id, { name })
    return json({ ok: true, updated: true })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestDelete(context) {
  try {
    const folder = await context.env.CMS_DB.prepare('SELECT f.*, COUNT(m.id) AS item_count FROM media_folders f LEFT JOIN media_items m ON m.folder_id = f.id WHERE f.id = ?1 GROUP BY f.id').bind(context.params.id).first()
    if (!folder) return apiError(404, 'Folder not found.', 'MEDIA_FOLDER_NOT_FOUND')
    if (Number(folder.item_count)) throw new CmsError(409, 'Move or delete the files in this folder first.', 'MEDIA_FOLDER_NOT_EMPTY')
    await context.env.CMS_DB.prepare('DELETE FROM media_folders WHERE id = ?1').bind(folder.id).run()
    await writeAudit(context.env, context.data.admin.username, 'delete_media_folder', 'media_folder', folder.id, { name: folder.name })
    return json({ ok: true, deleted: true })
  } catch (error) { return handleCmsError(error, context.request) }
}

import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request, 2048)
    const name = String(body.name || '').trim().replace(/[\\/]/g, '-').slice(0, 80)
    const parentId = body.parentId || null
    if (!name) throw new CmsError(400, 'Folder name is required.', 'MEDIA_FOLDER_NAME_REQUIRED')
    if (parentId) {
      const parent = await context.env.CMS_DB.prepare('SELECT id FROM media_folders WHERE id = ?1').bind(parentId).first()
      if (!parent) throw new CmsError(404, 'Parent folder not found.', 'MEDIA_FOLDER_NOT_FOUND')
    }
    const id = crypto.randomUUID()
    await context.env.CMS_DB.prepare('INSERT INTO media_folders (id, name, parent_id, created_by) VALUES (?1, ?2, ?3, ?4)').bind(id, name, parentId, context.data.admin.username).run()
    await writeAudit(context.env, context.data.admin.username, 'create_media_folder', 'media_folder', id, { name })
    return json({ ok: true, folder: { id, name, parent_id: parentId, item_count: 0 } }, { status: 201 })
  } catch (error) { return handleCmsError(error, context.request) }
}

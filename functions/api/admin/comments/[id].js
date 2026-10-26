import { handleCmsError, json, writeAudit } from '../../../_lib/cms.js'

export async function onRequestDelete(context) {
  try {
    const id = String(context.params.id)
    const result = await context.env.CMS_DB.prepare('DELETE FROM blog_comments WHERE id = ?1').bind(id).run()
    await writeAudit(context.env, context.data.admin.username, 'delete_comment', 'blog_comment', id)
    return json({ ok: true, deleted: result.meta.changes > 0 })
  } catch (error) { return handleCmsError(error, context.request) }
}

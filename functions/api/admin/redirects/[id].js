import { apiError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

export async function onRequestPatch(context) {
  try {
    const body = await readJson(context.request, 2048)
    const statusCode = Number(body.statusCode) === 302 ? 302 : 301
    const isActive = body.isActive === false ? 0 : 1
    const result = await context.env.CMS_DB.prepare('UPDATE seo_redirects SET status_code = ?1, is_active = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3').bind(statusCode, isActive, context.params.id).run()
    if (!result.meta.changes) return apiError(404, 'Redirect not found.', 'REDIRECT_NOT_FOUND')
    await writeAudit(context.env, context.data.admin.username, 'update_redirect', 'redirect', context.params.id, { statusCode, isActive })
    return json({ ok: true, updated: true })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestDelete(context) {
  try {
    const result = await context.env.CMS_DB.prepare('DELETE FROM seo_redirects WHERE id = ?1').bind(context.params.id).run()
    if (!result.meta.changes) return apiError(404, 'Redirect not found.', 'REDIRECT_NOT_FOUND')
    await writeAudit(context.env, context.data.admin.username, 'delete_redirect', 'redirect', context.params.id)
    return json({ ok: true, deleted: true })
  } catch (error) { return handleCmsError(error, context.request) }
}

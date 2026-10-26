import { apiError, handleCmsError, json, readJson } from '../../../_lib/cms.js'

export async function onRequestGet(context) {
  const userId = context.data.admin.id || null
  const result = await context.env.CMS_DB.prepare(`
    SELECT id, type, title, message, action_hash, read_at, created_at
    FROM admin_notifications
    WHERE (user_id IS NULL OR user_id = ?1) AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ORDER BY read_at IS NULL DESC, created_at DESC LIMIT 30
  `).bind(userId).all()
  return json({ ok: true, notifications: result.results.map(row => ({ id: row.id, type: row.type, title: row.title, message: row.message, actionHash: row.action_hash, readAt: row.read_at, createdAt: row.created_at })), unread: result.results.filter(row => !row.read_at).length })
}

export async function onRequestPatch(context) {
  try {
    const body = await readJson(context.request, 4096)
    const userId = context.data.admin.id || null
    if (body.all === true) {
      await context.env.CMS_DB.prepare('UPDATE admin_notifications SET read_at = CURRENT_TIMESTAMP WHERE read_at IS NULL AND (user_id IS NULL OR user_id = ?1)').bind(userId).run()
    } else if (body.id) {
      const result = await context.env.CMS_DB.prepare('UPDATE admin_notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?1 AND (user_id IS NULL OR user_id = ?2)').bind(String(body.id), userId).run()
      if (!result.meta.changes) return apiError(404, 'Notification not found.', 'NOTIFICATION_NOT_FOUND')
    } else return apiError(400, 'Notification id is required.', 'NOTIFICATION_ID_REQUIRED')
    return json({ ok: true })
  } catch (error) { return handleCmsError(error, context.request) }
}


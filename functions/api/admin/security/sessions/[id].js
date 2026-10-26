import { apiError, json, writeAudit } from '../../../../_lib/cms.js'

export async function onRequestDelete(context) {
  if (context.params.id === context.data.admin.tokenHash) return apiError(400, 'Sign out normally to end your current session.', 'CURRENT_SESSION')
  const result = await context.env.CMS_DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?1').bind(context.params.id).run()
  if (!result.meta.changes) return apiError(404, 'Session not found.', 'SESSION_NOT_FOUND')
  await writeAudit(context.env, context.data.admin.username, 'revoke', 'session', null, { tokenHashPrefix: context.params.id.slice(0, 12) })
  return json({ ok: true })
}


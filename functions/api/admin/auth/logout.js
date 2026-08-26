import { clearSessionCookie, json, writeAudit } from '../../../_lib/cms.js'

export async function onRequestPost(context) {
  await context.env.CMS_DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?1')
    .bind(context.data.admin.tokenHash)
    .run()
  await writeAudit(context.env, context.data.admin.username, 'logout', 'session')
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
}

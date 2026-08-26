import { getAdminSession, json } from '../../../_lib/cms.js'

export async function onRequestGet(context) {
  const session = await getAdminSession(context.request, context.env)
  if (!session) return json({ ok: true, authenticated: false, user: null })
  context.waitUntil(context.env.CMS_DB.prepare(`
    UPDATE admin_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?1
  `).bind(session.tokenHash).run())
  return json({ ok: true, authenticated: true, user: { username: session.username } })
}

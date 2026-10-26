import { getAdminSession, json } from '../_lib/cms.js'
import { findAdminUser, getUserAccess, publicAdminUser } from '../_lib/admin-auth.js'

export async function onRequestGet(context) {
  const session = await getAdminSession(context.request, context.env)
  if (!session) return json({ ok: true, authenticated: false, user: null })

  context.waitUntil(context.env.CMS_DB.prepare(`
    UPDATE admin_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?1
  `).bind(session.tokenHash).run())

  try {
    const user = await findAdminUser(context.env, session.username)
    if (user?.status === 'active') return json({ ok: true, authenticated: true, user: publicAdminUser(user, await getUserAccess(context.env, user.id)) })
  } catch {
    // The identity migration may not be applied during a rolling deployment.
  }
  return json({ ok: true, authenticated: true, user: publicAdminUser({ username: session.username }, { roles: [{ id: 'legacy-super-admin', name: 'Super Admin' }], permissions: ['*'] }) })
}

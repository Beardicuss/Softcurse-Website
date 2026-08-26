import { apiError, getAdminSession, requireSameOrigin } from '../../_lib/cms.js'

export async function onRequest(context) {
  const path = new URL(context.request.url).pathname.replace(/\/+$/, '')
  if (path.startsWith('/api/admin/auth/login') || path.startsWith('/api/admin/auth/session')) return context.next()

  const session = await getAdminSession(context.request, context.env)
  if (!session) return apiError(401, 'Sign in to access the control panel.', 'AUTH_REQUIRED')

  if (!['GET', 'HEAD', 'OPTIONS'].includes(context.request.method)) {
    try {
      requireSameOrigin(context.request)
    } catch {
      return apiError(403, 'Cross-origin admin requests are not allowed.', 'ORIGIN_REJECTED')
    }
  }

  context.data.admin = { username: session.username, tokenHash: session.tokenHash }
  context.waitUntil(context.env.CMS_DB.prepare(`
    UPDATE admin_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?1
  `).bind(session.tokenHash).run())

  const response = await context.next()
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

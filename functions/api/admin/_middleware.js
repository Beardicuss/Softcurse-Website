import { apiError, getAdminSession, requireSameOrigin } from '../../_lib/cms.js'
import { can, findAdminUser, getUserAccess, publicAdminUser } from '../../_lib/admin-auth.js'

function requiredPermission(path, method) {
  if (path.includes('/dashboard')) return 'dashboard.view'
  if (path.includes('/users') || path.includes('/roles')) return ['GET', 'HEAD'].includes(method) ? 'users.view' : 'users.manage'
  if (path.includes('/security/')) return ['GET', 'HEAD'].includes(method) ? 'security.view' : 'security.manage'
  if (path.includes('/ai/')) return 'ai.use'
  if (path.includes('/notifications')) return 'dashboard.view'
  if (path.includes('/messages')) return ['GET', 'HEAD'].includes(method) ? 'messages.view' : 'messages.manage'
  if (path.includes('/comments')) return ['GET', 'HEAD'].includes(method) ? 'comments.view' : 'comments.manage'
  if (path.includes('/search')) return 'dashboard.view'
  if (path.includes('/analytics')) return 'analytics.view'
  if (path.includes('/system')) return ['GET', 'HEAD'].includes(method) ? 'security.view' : 'system.manage'
  if (path.includes('/layout')) return ['GET', 'HEAD'].includes(method) ? 'layout.view' : 'layout.manage'
  if (path.includes('/developer')) return ['GET', 'HEAD'].includes(method) ? 'developer.view' : 'developer.manage'
  if (path.includes('/store')) return ['GET', 'HEAD'].includes(method) ? 'orders.view' : 'orders.manage'
  if (path.includes('/settings') || path.includes('/redirects')) return ['GET', 'HEAD'].includes(method) ? 'settings.view' : 'settings.manage'
  if (path.includes('/schema')) return 'content.view'
  if (path.includes('/assets') || path.includes('/uploads') || path.includes('/media')) return ['GET', 'HEAD'].includes(method) ? 'media.view' : 'media.manage'
  if (path.includes('/releases') || path.includes('/chapters') || path.includes('/roadmap-sync')) return ['GET', 'HEAD'].includes(method) ? 'releases.view' : 'releases.manage'
  if (path.includes('/commerce') || path.includes('/entitlements')) return ['GET', 'HEAD'].includes(method) ? 'commerce.view' : 'commerce.manage'
  if (path.includes('/content')) return ['GET', 'HEAD'].includes(method) ? 'content.view' : method === 'POST' ? 'content.create' : 'content.update'
  return null
}

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

  let principal = { username: session.username, tokenHash: session.tokenHash, permissions: ['*'], roles: [{ id: 'legacy-super-admin', name: 'Super Admin' }] }
  try {
    const user = await findAdminUser(context.env, session.username)
    if (user) {
      if (user.status !== 'active') return apiError(403, 'This administrator account is not active.', 'ACCOUNT_DISABLED')
      const access = await getUserAccess(context.env, user.id)
      principal = { ...publicAdminUser(user, access), tokenHash: session.tokenHash }
    }
  } catch {
    // Keep legacy sessions operational until the RBAC migration is applied.
  }

  const permission = requiredPermission(path, context.request.method)
  if (permission && !can(principal.permissions, permission)) {
    return apiError(403, 'Your role does not allow this action.', 'PERMISSION_DENIED')
  }

  context.data.admin = principal
  context.waitUntil(context.env.CMS_DB.prepare(`
    UPDATE admin_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE token_hash = ?1
  `).bind(session.tokenHash).run())

  const response = await context.next()
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

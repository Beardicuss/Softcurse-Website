import { apiError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'
import { hashAdminPassword } from '../../../_lib/admin-auth.js'

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,39}$/i

export async function onRequestGet(context) {
  const result = await context.env.CMS_DB.prepare(`
    SELECT u.id, u.username, u.display_name, u.email, u.status, u.locale, u.theme,
      u.must_change_password, u.created_at, u.last_login_at,
      COALESCE(json_group_array(json_object('id', r.id, 'name', r.name)) FILTER (WHERE r.id IS NOT NULL), '[]') AS roles_json
    FROM admin_users u
    LEFT JOIN admin_user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    GROUP BY u.id ORDER BY u.created_at
  `).all()
  return json({ ok: true, users: result.results.map(row => ({
    id: row.id, username: row.username, displayName: row.display_name, email: row.email,
    status: row.status, locale: row.locale, theme: row.theme, mustChangePassword: Boolean(row.must_change_password),
    createdAt: row.created_at, lastLoginAt: row.last_login_at, roles: JSON.parse(row.roles_json), current: row.id === context.data.admin.id,
  })) })
}

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request, 16384)
    const username = String(body.username || '').trim()
    const displayName = String(body.displayName || username).trim().slice(0, 100)
    const email = body.email ? String(body.email).trim().toLowerCase().slice(0, 254) : null
    const roleIds = Array.isArray(body.roleIds) ? [...new Set(body.roleIds.map(String))].slice(0, 10) : []
    if (!USERNAME_PATTERN.test(username)) return apiError(400, 'Username must contain 3–40 letters, numbers, dots, dashes, or underscores.', 'INVALID_USERNAME')
    if (!roleIds.length) return apiError(400, 'Select at least one role.', 'ROLE_REQUIRED')
    const passwordHash = await hashAdminPassword(String(body.password || ''))
    const id = `admin-${crypto.randomUUID()}`
    const statements = [context.env.CMS_DB.prepare(`INSERT INTO admin_users (id, username, display_name, email, password_hash, must_change_password) VALUES (?1, ?2, ?3, ?4, ?5, 1)`).bind(id, username, displayName, email, passwordHash)]
    for (const roleId of roleIds) statements.push(context.env.CMS_DB.prepare(`INSERT INTO admin_user_roles (user_id, role_id, assigned_by) VALUES (?1, ?2, ?3)`).bind(id, roleId, context.data.admin.username))
    await context.env.CMS_DB.batch(statements)
    await writeAudit(context.env, context.data.admin.username, 'create', 'admin_user', id, { username, roleIds })
    return json({ ok: true, id }, { status: 201 })
  } catch (error) {
    if (String(error?.message).includes('UNIQUE constraint')) return apiError(409, 'That username or email is already in use.', 'ADMIN_USER_CONFLICT')
    return handleCmsError(error, context.request)
  }
}

import { apiError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'
import { hashAdminPassword } from '../../../_lib/admin-auth.js'

export async function onRequestPatch(context) {
  try {
    const id = context.params.id
    const existing = await context.env.CMS_DB.prepare('SELECT * FROM admin_users WHERE id = ?1').bind(id).first()
    if (!existing) return apiError(404, 'Administrator not found.', 'ADMIN_USER_NOT_FOUND')
    const body = await readJson(context.request, 16384)
    const displayName = body.displayName === undefined ? existing.display_name : String(body.displayName).trim().slice(0, 100)
    const email = body.email === undefined ? existing.email : (body.email ? String(body.email).trim().toLowerCase().slice(0, 254) : null)
    const status = body.status === undefined ? existing.status : String(body.status)
    if (!['active', 'suspended', 'disabled'].includes(status)) return apiError(400, 'Invalid account status.', 'INVALID_ACCOUNT_STATUS')
    if (id === context.data.admin.id && status !== 'active') return apiError(400, 'You cannot disable your own account.', 'SELF_DISABLE_REJECTED')
    const passwordHash = body.password ? await hashAdminPassword(String(body.password)) : existing.password_hash
    const roleIds = body.roleIds === undefined ? null : [...new Set((Array.isArray(body.roleIds) ? body.roleIds : []).map(String))].slice(0, 10)
    if (roleIds && !roleIds.length) return apiError(400, 'Select at least one role.', 'ROLE_REQUIRED')
    const statements = [context.env.CMS_DB.prepare(`UPDATE admin_users SET display_name = ?1, email = ?2, status = ?3, password_hash = ?4, must_change_password = ?5, updated_at = CURRENT_TIMESTAMP WHERE id = ?6`).bind(displayName, email, status, passwordHash, body.password ? 1 : existing.must_change_password, id)]
    if (roleIds) {
      statements.push(context.env.CMS_DB.prepare('DELETE FROM admin_user_roles WHERE user_id = ?1').bind(id))
      for (const roleId of roleIds) statements.push(context.env.CMS_DB.prepare(`INSERT INTO admin_user_roles (user_id, role_id, assigned_by) VALUES (?1, ?2, ?3)`).bind(id, roleId, context.data.admin.username))
    }
    await context.env.CMS_DB.batch(statements)
    if (status !== 'active') await context.env.CMS_DB.prepare('DELETE FROM admin_sessions WHERE admin_user_id = ?1').bind(id).run()
    await writeAudit(context.env, context.data.admin.username, 'update', 'admin_user', id, { status, rolesChanged: Boolean(roleIds), passwordReset: Boolean(body.password) })
    return json({ ok: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}


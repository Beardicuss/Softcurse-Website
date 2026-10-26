import { apiError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'
import { findAdminUser, hashAdminPassword, verifyAdminPassword } from '../../../_lib/admin-auth.js'

export async function onRequestPost(context) {
  try {
    const user = await findAdminUser(context.env, context.data.admin.username)
    if (!user) return apiError(409, 'This legacy session must sign out and back in before changing its password.', 'IDENTITY_MIGRATION_REQUIRED')
    const body = await readJson(context.request, 8192)
    if (!await verifyAdminPassword(String(body.currentPassword || ''), user.password_hash)) return apiError(401, 'Current password is incorrect.', 'INVALID_CURRENT_PASSWORD')
    const passwordHash = await hashAdminPassword(String(body.newPassword || ''))
    if (await verifyAdminPassword(String(body.newPassword || ''), user.password_hash)) return apiError(400, 'Choose a password different from the current password.', 'PASSWORD_REUSED')
    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare('UPDATE admin_users SET password_hash = ?1, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?2').bind(passwordHash, user.id),
      context.env.CMS_DB.prepare('DELETE FROM admin_sessions WHERE admin_user_id = ?1 AND token_hash != ?2').bind(user.id, context.data.admin.tokenHash),
    ])
    await writeAudit(context.env, user.username, 'change_password', 'admin_user', user.id)
    return json({ ok: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}


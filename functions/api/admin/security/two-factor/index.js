import { apiError, handleCmsError, json, readJson, writeAudit } from '../../../../_lib/cms.js'
import { findAdminUser, verifyAdminPassword } from '../../../../_lib/admin-auth.js'
import { decryptTotpSecret, encryptTotpSecret, generateRecoveryCodes, generateTotpSecret, verifyTotp } from '../../../../_lib/totp.js'

async function currentUser(context) {
  return findAdminUser(context.env, context.data.admin.username)
}

export async function onRequestGet(context) {
  const user = await currentUser(context)
  const credential = user ? await context.env.CMS_DB.prepare('SELECT verified_at FROM admin_totp_credentials WHERE user_id = ?1').bind(user.id).first() : null
  const recoveryCodes = user ? Number(await context.env.CMS_DB.prepare('SELECT COUNT(*) AS count FROM admin_recovery_codes WHERE user_id = ?1 AND used_at IS NULL').bind(user.id).first('count') || 0) : 0
  return json({ ok: true, enabled: Boolean(credential?.verified_at), pending: Boolean(credential && !credential.verified_at), recoveryCodes })
}

export async function onRequestPost(context) {
  try {
    const user = await currentUser(context)
    if (!user) return apiError(409, 'Database identity required.', 'IDENTITY_REQUIRED')
    const body = await readJson(context.request, 8192)
    if (!await verifyAdminPassword(String(body.currentPassword || ''), user.password_hash)) return apiError(401, 'Current password is incorrect.', 'INVALID_CURRENT_PASSWORD')
    const secret = generateTotpSecret()
    await context.env.CMS_DB.prepare(`INSERT INTO admin_totp_credentials (user_id, secret_encrypted, verified_at) VALUES (?1, ?2, NULL) ON CONFLICT(user_id) DO UPDATE SET secret_encrypted = excluded.secret_encrypted, verified_at = NULL, created_at = CURRENT_TIMESTAMP`).bind(user.id, await encryptTotpSecret(context.env, secret)).run()
    const issuer = 'Softcurse Control'
    const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
    await writeAudit(context.env, user.username, 'begin_2fa_setup', 'admin_user', user.id)
    return json({ ok: true, secret, uri })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPut(context) {
  try {
    const user = await currentUser(context)
    const credential = user ? await context.env.CMS_DB.prepare('SELECT secret_encrypted FROM admin_totp_credentials WHERE user_id = ?1 AND verified_at IS NULL').bind(user.id).first() : null
    if (!credential) return apiError(409, 'Start two-factor setup first.', 'TOTP_SETUP_REQUIRED')
    const body = await readJson(context.request, 4096)
    if (!await verifyTotp(await decryptTotpSecret(context.env, credential.secret_encrypted), body.code)) return apiError(400, 'That authenticator code is invalid or expired.', 'INVALID_TOTP')
    const recovery = await generateRecoveryCodes()
    const statements = [
      context.env.CMS_DB.prepare('UPDATE admin_totp_credentials SET verified_at = CURRENT_TIMESTAMP WHERE user_id = ?1').bind(user.id),
      context.env.CMS_DB.prepare('DELETE FROM admin_recovery_codes WHERE user_id = ?1').bind(user.id),
    ]
    recovery.hashes.forEach((hash, index) => statements.push(context.env.CMS_DB.prepare('INSERT INTO admin_recovery_codes (id, user_id, code_hash) VALUES (?1, ?2, ?3)').bind(`recovery-${crypto.randomUUID()}-${index}`, user.id, hash)))
    await context.env.CMS_DB.batch(statements)
    await writeAudit(context.env, user.username, 'enable_2fa', 'admin_user', user.id)
    return json({ ok: true, recoveryCodes: recovery.codes })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestDelete(context) {
  try {
    const user = await currentUser(context)
    const body = await readJson(context.request, 8192)
    if (!user || !await verifyAdminPassword(String(body.currentPassword || ''), user.password_hash)) return apiError(401, 'Current password is incorrect.', 'INVALID_CURRENT_PASSWORD')
    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare('DELETE FROM admin_totp_credentials WHERE user_id = ?1').bind(user.id),
      context.env.CMS_DB.prepare('DELETE FROM admin_recovery_codes WHERE user_id = ?1').bind(user.id),
    ])
    await writeAudit(context.env, user.username, 'disable_2fa', 'admin_user', user.id)
    return json({ ok: true })
  } catch (error) { return handleCmsError(error, context.request) }
}


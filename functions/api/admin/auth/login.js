import {
  apiError,
  handleCmsError,
  json,
  readJson,
  requireSameOrigin,
  secureEqual,
  sha256Hex,
  writeAudit,
} from '../../../_lib/cms.js'
import {
  bootstrapAdminUser,
  createAdminSession,
  findAdminUser,
  getUserAccess,
  publicAdminUser,
  verifyAdminPassword,
} from '../../../_lib/admin-auth.js'
import { sessionCookie } from '../../../_lib/cms.js'
import { consumeRecoveryCode, decryptTotpSecret, verifyTotp } from '../../../_lib/totp.js'

const DEFAULT_ADMIN_USERNAME = 'softcurse'

export async function onRequestPost(context) {
  try {
    requireSameOrigin(context.request)
    if (!context.env.ADMIN_PASSWORD) {
      return apiError(503, 'Admin authentication has not been configured.', 'AUTH_NOT_CONFIGURED')
    }

    const body = await readJson(context.request, 4096)
    const username = String(body.username || '')
    const password = String(body.password || '')
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'
    const ipHash = await sha256Hex(ip)

    const recentFailures = await context.env.CMS_DB.prepare(`
      SELECT COUNT(*) AS count
      FROM login_attempts
      WHERE ip_hash = ?1 AND success = 0 AND attempted_at > datetime('now', '-15 minutes')
    `).bind(ipHash).first('count')

    if (Number(recentFailures || 0) >= 5) {
      return apiError(429, 'Too many sign-in attempts. Try again in 15 minutes.', 'LOGIN_RATE_LIMITED')
    }

    let user = null
    let databaseAuthAvailable = true
    try {
      user = await findAdminUser(context.env, username)
    } catch {
      databaseAuthAvailable = false
    }

    let valid = false
    if (user) {
      valid = user.status === 'active' && await verifyAdminPassword(password, user.password_hash)
    } else {
      const [validUsername, validPassword] = await Promise.all([
        secureEqual(username, context.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME),
        secureEqual(password, context.env.ADMIN_PASSWORD),
      ])
      valid = validUsername && validPassword
      if (valid && databaseAuthAvailable) user = await bootstrapAdminUser(context.env, username, password)
    }

    if (!valid) {
      await context.env.CMS_DB.prepare('INSERT INTO login_attempts (ip_hash, success) VALUES (?1, 0)').bind(ipHash).run()
      return apiError(401, 'Incorrect username or password.', 'INVALID_CREDENTIALS')
    }

    if (user?.id) {
      const credential = await context.env.CMS_DB.prepare('SELECT secret_encrypted FROM admin_totp_credentials WHERE user_id = ?1 AND verified_at IS NOT NULL').bind(user.id).first()
      if (credential) {
        const providedCode = String(body.totpCode || '').trim()
        if (!providedCode) return json({ ok: true, twoFactorRequired: true }, { status: 202 })
        const accepted = providedCode.includes('-')
          ? await consumeRecoveryCode(context.env, user.id, providedCode)
          : await verifyTotp(await decryptTotpSecret(context.env, credential.secret_encrypted), providedCode)
        if (!accepted) {
          await context.env.CMS_DB.prepare('INSERT INTO login_attempts (ip_hash, success) VALUES (?1, 0)').bind(ipHash).run()
          return apiError(401, 'Invalid authenticator or recovery code.', 'INVALID_TWO_FACTOR_CODE')
        }
      }
    }
    await context.env.CMS_DB.prepare('INSERT INTO login_attempts (ip_hash, success) VALUES (?1, 1)').bind(ipHash).run()

    const hours = Math.min(24, Math.max(1, Number(context.env.ADMIN_SESSION_HOURS || 12)))
    let session
    try {
      session = await createAdminSession(context.env, context.request, user || { username }, hours)
    } catch (error) {
      if (databaseAuthAvailable) throw error
      const token = crypto.randomUUID() + crypto.randomUUID()
      const tokenHash = await sha256Hex(token)
      const expiresAt = new Date(Date.now() + hours * 3600000).toISOString()
      await context.env.CMS_DB.prepare(`INSERT INTO admin_sessions (token_hash, username, ip_hash, user_agent, expires_at) VALUES (?1, ?2, ?3, ?4, ?5)`)
        .bind(tokenHash, username, ipHash, (context.request.headers.get('user-agent') || '').slice(0, 500), expiresAt).run()
      session = { token, tokenHash, ipHash, expiresAt }
    }

    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP'),
      context.env.CMS_DB.prepare("DELETE FROM login_attempts WHERE attempted_at <= datetime('now', '-1 day')"),
    ])

    if (user?.id) await context.env.CMS_DB.prepare('UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?1').bind(user.id).run()
    const access = user?.id ? await getUserAccess(context.env, user.id) : { roles: [{ id: 'legacy-super-admin', name: 'Super Admin' }], permissions: ['*'] }
    const responseUser = publicAdminUser(user || { username }, access)
    await writeAudit(context.env, username, 'login', 'session', null, { ipHash: session.ipHash })

    return json({ ok: true, user: responseUser, expiresAt: session.expiresAt }, {
      headers: { 'Set-Cookie': sessionCookie(session.token, hours * 3600, new URL(context.request.url).protocol === 'https:') },
    })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export function onRequest() {
  return apiError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED')
}

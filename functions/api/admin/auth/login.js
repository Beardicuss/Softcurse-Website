import {
  apiError,
  handleCmsError,
  json,
  randomToken,
  readJson,
  requireSameOrigin,
  secureEqual,
  sessionCookie,
  sha256Hex,
  writeAudit,
} from '../../../_lib/cms.js'

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

    const [validUsername, validPassword] = await Promise.all([
      secureEqual(username, context.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME),
      secureEqual(password, context.env.ADMIN_PASSWORD),
    ])
    const valid = validUsername && validPassword

    await context.env.CMS_DB.prepare(`
      INSERT INTO login_attempts (ip_hash, success) VALUES (?1, ?2)
    `).bind(ipHash, valid ? 1 : 0).run()

    if (!valid) return apiError(401, 'Incorrect username or password.', 'INVALID_CREDENTIALS')

    const token = randomToken()
    const tokenHash = await sha256Hex(token)
    const hours = Math.min(24, Math.max(1, Number(context.env.ADMIN_SESSION_HOURS || 12)))
    const expiresAt = new Date(Date.now() + hours * 3600000).toISOString()

    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare(`
        INSERT INTO admin_sessions (token_hash, username, ip_hash, user_agent, expires_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
      `).bind(
        tokenHash,
        context.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME,
        ipHash,
        (context.request.headers.get('user-agent') || '').slice(0, 500),
        expiresAt,
      ),
      context.env.CMS_DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP'),
      context.env.CMS_DB.prepare("DELETE FROM login_attempts WHERE attempted_at <= datetime('now', '-1 day')"),
    ])

    await writeAudit(context.env, context.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME, 'login', 'session', null, { ipHash })

    return json({ ok: true, user: { username: context.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME }, expiresAt }, {
      headers: { 'Set-Cookie': sessionCookie(token, hours * 3600, new URL(context.request.url).protocol === 'https:') },
    })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export function onRequest() {
  return apiError(405, 'Method not allowed.', 'METHOD_NOT_ALLOWED')
}

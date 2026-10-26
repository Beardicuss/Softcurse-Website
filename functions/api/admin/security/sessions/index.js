import { json } from '../../../../_lib/cms.js'

export async function onRequestGet(context) {
  const result = await context.env.CMS_DB.prepare(`
    SELECT token_hash, username, ip_hash, user_agent, created_at, last_seen_at, expires_at
    FROM admin_sessions WHERE expires_at > CURRENT_TIMESTAMP ORDER BY last_seen_at DESC
  `).all()
  return json({ ok: true, sessions: result.results.map(row => ({
    id: row.token_hash, username: row.username, ipHash: row.ip_hash.slice(0, 12), userAgent: row.user_agent,
    createdAt: row.created_at, lastSeenAt: row.last_seen_at, expiresAt: row.expires_at,
    current: row.token_hash === context.data.admin.tokenHash,
  })) })
}


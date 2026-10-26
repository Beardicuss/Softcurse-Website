import { sha256Hex } from './cms.js'

export const API_SCOPES = new Set(['content.read', 'analytics.read'])

export async function authenticateApiToken(request, env, requiredScope) {
  const authorization = request.headers.get('Authorization') || ''
  if (!authorization.startsWith('Bearer sc_live_')) return null
  const hash = await sha256Hex(authorization.slice(7))
  const token = await env.CMS_DB.prepare(`SELECT * FROM api_tokens WHERE token_hash = ?1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`).bind(hash).first()
  if (!token) return null
  const scopes = JSON.parse(token.scopes_json)
  if (!scopes.includes(requiredScope)) return null
  env.CMS_DB.prepare('UPDATE api_tokens SET last_used_at = CURRENT_TIMESTAMP, request_count = request_count + 1 WHERE id = ?1').bind(token.id).run().catch(() => {})
  return { ...token, scopes }
}

export function validExternalHttps(value) {
  let url
  try { url = new URL(value) } catch { return false }
  if (url.protocol !== 'https:' || url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0' || host === '::1') return false
  if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false
  return true
}

export function validSubresourceIntegrity(value) {
  const integrity = String(value || '').trim()
  return /^(sha256|sha384|sha512)-[A-Za-z0-9+/]+={0,2}(\s+(sha256|sha384|sha512)-[A-Za-z0-9+/]+={0,2})*$/.test(integrity)
}

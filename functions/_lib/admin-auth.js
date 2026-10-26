import { CmsError, randomToken, secureEqual } from './cms.js'

// Cloudflare Workers currently rejects PBKDF2 iteration counts above 100,000.
const PBKDF2_ITERATIONS = 100000

function encodeBytes(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBytes(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function derivePassword(password, salt, iterations = PBKDF2_ITERATIONS) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, 256)
  return new Uint8Array(bits)
}

export async function hashAdminPassword(password) {
  if (typeof password !== 'string' || password.length < 12) {
    throw new CmsError(400, 'Administrator passwords must contain at least 12 characters.', 'WEAK_PASSWORD')
  }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePassword(password, salt)
  return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${encodeBytes(salt)}$${encodeBytes(hash)}`
}

export async function verifyAdminPassword(password, encoded) {
  const [algorithm, iterationText, saltText, hashText] = String(encoded || '').split('$')
  const iterations = Number(iterationText)
  if (algorithm !== 'pbkdf2_sha256' || !Number.isInteger(iterations) || iterations < 100000 || !saltText || !hashText) return false
  const actual = await derivePassword(String(password), decodeBytes(saltText), iterations)
  return secureEqual(encodeBytes(actual), hashText)
}

export async function findAdminUser(env, username) {
  return env.CMS_DB.prepare(`
    SELECT id, username, display_name, email, password_hash, status, locale, theme, must_change_password
    FROM admin_users WHERE username = ?1 COLLATE NOCASE
  `).bind(username).first()
}

export async function getUserAccess(env, userId) {
  const [roles, permissions] = await env.CMS_DB.batch([
    env.CMS_DB.prepare(`SELECT r.id, r.name FROM roles r JOIN admin_user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?1 ORDER BY r.name`).bind(userId),
    env.CMS_DB.prepare(`SELECT DISTINCT rp.permission_key AS key FROM role_permissions rp JOIN admin_user_roles ur ON ur.role_id = rp.role_id WHERE ur.user_id = ?1 ORDER BY rp.permission_key`).bind(userId),
  ])
  return { roles: roles.results, permissions: permissions.results.map(row => row.key) }
}

export async function bootstrapAdminUser(env, username, password) {
  const existing = await findAdminUser(env, username)
  if (existing) return existing
  const id = `admin-${crypto.randomUUID()}`
  const passwordHash = await hashAdminPassword(password)
  await env.CMS_DB.batch([
    env.CMS_DB.prepare(`INSERT INTO admin_users (id, username, display_name, password_hash) VALUES (?1, ?2, ?3, ?4)`).bind(id, username, username, passwordHash),
    env.CMS_DB.prepare(`INSERT INTO admin_user_roles (user_id, role_id, assigned_by) VALUES (?1, 'role-super-admin', ?2)`).bind(id, username),
  ])
  return findAdminUser(env, username)
}

export async function createAdminSession(env, request, user, hours) {
  const token = randomToken()
  const tokenHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const tokenHash = Array.from(new Uint8Array(tokenHashBuffer), byte => byte.toString(16).padStart(2, '0')).join('')
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const ipHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  const ipHash = Array.from(new Uint8Array(ipHashBuffer), byte => byte.toString(16).padStart(2, '0')).join('')
  const expiresAt = new Date(Date.now() + hours * 3600000).toISOString()
  await env.CMS_DB.prepare(`
    INSERT INTO admin_sessions (token_hash, username, ip_hash, user_agent, expires_at, admin_user_id)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `).bind(tokenHash, user.username, ipHash, (request.headers.get('user-agent') || '').slice(0, 500), expiresAt, user.id || null).run()
  return { token, tokenHash, ipHash, expiresAt }
}

export function publicAdminUser(user, access = { roles: [], permissions: [] }) {
  return {
    id: user.id || null,
    username: user.username,
    displayName: user.display_name || user.username,
    email: user.email || null,
    locale: user.locale || 'en',
    theme: user.theme || 'system',
    mustChangePassword: Boolean(user.must_change_password),
    roles: access.roles,
    permissions: access.permissions,
  }
}

export function can(permissionList, permission) {
  return permissionList.includes('*') || permissionList.includes(permission)
}

export function requirePermission(admin, permission) {
  if (!can(admin?.permissions || [], permission)) throw new CmsError(403, 'Your role does not allow this action.', 'PERMISSION_DENIED')
}

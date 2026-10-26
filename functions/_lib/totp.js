import { CmsError, randomToken, secureEqual, sha256Hex } from './cms.js'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function encodeBase32(bytes) {
  let bits = 0; let value = 0; let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8
    while (bits >= 5) { output += BASE32[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits) output += BASE32[(value << (5 - bits)) & 31]
  return output
}

export function decodeBase32(input) {
  let bits = 0; let value = 0; const output = []
  for (const character of input.toUpperCase().replace(/[^A-Z2-7]/g, '')) {
    const index = BASE32.indexOf(character)
    if (index < 0) throw new CmsError(400, 'Invalid authenticator secret.', 'INVALID_TOTP_SECRET')
    value = (value << 5) | index; bits += 5
    if (bits >= 8) { output.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return new Uint8Array(output)
}

export function generateTotpSecret() {
  return encodeBase32(crypto.getRandomValues(new Uint8Array(20)))
}

async function totpAt(secret, counter) {
  const key = await crypto.subtle.importKey('raw', decodeBase32(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const bytes = new Uint8Array(8)
  let remaining = BigInt(counter)
  for (let index = 7; index >= 0; index -= 1) { bytes[index] = Number(remaining & 255n); remaining >>= 8n }
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes))
  const offset = digest[digest.length - 1] & 15
  const value = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3]
  return String(value % 1000000).padStart(6, '0')
}

export async function verifyTotp(secret, code, now = Date.now()) {
  const normalized = String(code || '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalized)) return false
  const counter = Math.floor(now / 30000)
  for (const offset of [-1, 0, 1]) if (await secureEqual(await totpAt(secret, counter + offset), normalized)) return true
  return false
}

async function encryptionKey(env) {
  const material = env.ADMIN_TOTP_KEY || env.ADMIN_PASSWORD
  if (!material) throw new CmsError(503, 'Two-factor encryption is not configured.', 'TOTP_NOT_CONFIGURED')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function encryptTotpSecret(env, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(env), new TextEncoder().encode(secret)))
  return `${encodeBase32(iv)}.${encodeBase32(encrypted)}`
}

export async function decryptTotpSecret(env, value) {
  const [iv, encrypted] = String(value).split('.')
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decodeBase32(iv) }, await encryptionKey(env), decodeBase32(encrypted))
  return new TextDecoder().decode(clear)
}

export async function generateRecoveryCodes() {
  const codes = Array.from({ length: 8 }, () => `${randomToken(5).slice(0, 5).toUpperCase()}-${randomToken(5).slice(0, 5).toUpperCase()}`)
  return { codes, hashes: await Promise.all(codes.map(code => sha256Hex(code))) }
}

export async function consumeRecoveryCode(env, userId, code) {
  const hash = await sha256Hex(String(code || '').trim().toUpperCase())
  const row = await env.CMS_DB.prepare('SELECT id FROM admin_recovery_codes WHERE user_id = ?1 AND code_hash = ?2 AND used_at IS NULL').bind(userId, hash).first()
  if (!row) return false
  await env.CMS_DB.prepare('UPDATE admin_recovery_codes SET used_at = CURRENT_TIMESTAMP WHERE id = ?1 AND used_at IS NULL').bind(row.id).run()
  return true
}


import { CmsError, randomToken, sha256Hex } from './cms.js'

export const ENTITLEMENT_STATUSES = new Set(['active', 'revoked', 'refunded', 'expired'])
export const ENTITLEMENT_SOURCES = new Set(['manual', 'purchase', 'promotion', 'support'])

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CmsError(400, 'Enter a valid customer email address.', 'INVALID_CUSTOMER_EMAIL')
  }
  return email
}

function requireDataKey(env) {
  if (!env.COMMERCE_DATA_KEY) {
    throw new CmsError(503, 'Commerce identity protection is not configured yet.', 'COMMERCE_IDENTITY_NOT_CONFIGURED')
  }
  return env.COMMERCE_DATA_KEY
}

async function hmacHex(secret, value) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function customerEmailHash(env, email) {
  return hmacHex(requireDataKey(env), normalizeEmail(email))
}

export async function upsertCustomer(env, email) {
  const emailHash = await customerEmailHash(env, email)
  const existing = await env.CMS_DB.prepare('SELECT * FROM customers WHERE email_hash = ?1').bind(emailHash).first()
  if (existing) {
    await env.CMS_DB.prepare('UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1').bind(existing.id).run()
    return existing
  }
  const id = crypto.randomUUID()
  await env.CMS_DB.prepare('INSERT INTO customers (id, email_hash) VALUES (?1, ?2)').bind(id, emailHash).run()
  return env.CMS_DB.prepare('SELECT * FROM customers WHERE id = ?1').bind(id).first()
}

export async function grantEntitlement(env, {
  email, contentId, orderId = null, source = 'manual', providerEntitlementId = null, expiresAt = null, note = null,
}) {
  if (!ENTITLEMENT_SOURCES.has(source)) throw new CmsError(400, 'Invalid entitlement source.', 'INVALID_ENTITLEMENT_SOURCE')
  if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || new Date(expiresAt) <= new Date())) {
    throw new CmsError(400, 'Entitlement expiry must be in the future.', 'INVALID_ENTITLEMENT_EXPIRY')
  }
  const content = await env.CMS_DB.prepare('SELECT id FROM content_items WHERE id = ?1').bind(contentId).first()
  if (!content) throw new CmsError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')
  const customer = await upsertCustomer(env, email)
  const id = crypto.randomUUID()
  await env.CMS_DB.prepare(`
    INSERT INTO entitlements (id, customer_id, content_id, order_id, status, expires_at, source, provider_entitlement_id, note)
    VALUES (?1, ?2, ?3, ?4, 'active', ?5, ?6, ?7, ?8)
    ON CONFLICT(customer_id, content_id) DO UPDATE SET
      order_id = excluded.order_id, status = 'active', expires_at = excluded.expires_at,
      revoked_at = NULL, source = excluded.source,
      provider_entitlement_id = COALESCE(excluded.provider_entitlement_id, entitlements.provider_entitlement_id),
      note = excluded.note
  `).bind(id, customer.id, contentId, orderId, expiresAt, source, providerEntitlementId, note?.slice(0, 500) || null).run()
  return env.CMS_DB.prepare('SELECT * FROM entitlements WHERE customer_id = ?1 AND content_id = ?2').bind(customer.id, contentId).first()
}

function licenseText() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  const characters = Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('')
  return `SC-${characters.match(/.{1,5}/g).join('-')}`
}

export async function createLicense(env, entitlementId, { activationLimit = null, expiresAt = null } = {}) {
  const entitlement = await activeEntitlement(env, entitlementId)
  const limit = activationLimit === '' || activationLimit == null ? null : Number(activationLimit)
  if (limit !== null && (!Number.isInteger(limit) || limit < 1 || limit > 1000)) throw new CmsError(400, 'Activation limit must be between 1 and 1000.', 'INVALID_ACTIVATION_LIMIT')
  if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || new Date(expiresAt) <= new Date())) {
    throw new CmsError(400, 'License expiry must be in the future.', 'INVALID_LICENSE_EXPIRY')
  }
  const license = licenseText()
  const licenseHash = await sha256Hex(license)
  const id = crypto.randomUUID()
  await env.CMS_DB.prepare(`
    INSERT INTO licenses (id, entitlement_id, license_hash, activation_limit, expires_at)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(id, entitlement.id, licenseHash, limit, expiresAt || entitlement.expires_at).run()
  return { id, license }
}

export async function activeEntitlement(env, entitlementId) {
  const entitlement = await env.CMS_DB.prepare(`
    SELECT * FROM entitlements WHERE id = ?1 AND status = 'active'
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `).bind(entitlementId).first()
  if (!entitlement) throw new CmsError(403, 'An active entitlement is required.', 'ENTITLEMENT_REQUIRED')
  return entitlement
}

export async function createProtectedDownload(env, entitlementId, releaseId, { ttlMinutes = 60, maxUses = 10 } = {}) {
  const entitlement = await activeEntitlement(env, entitlementId)
  const release = await env.CMS_DB.prepare(`
    SELECT r.* FROM releases r
    JOIN content_items c ON c.id = r.content_id
    JOIN commerce_products cp ON cp.content_id = r.content_id
    WHERE r.id = ?1 AND r.content_id = ?2 AND r.kind = 'file' AND r.status = 'published'
      AND c.status = 'published' AND cp.sale_mode = 'paid' AND cp.requires_entitlement = 1
  `).bind(releaseId, entitlement.content_id).first()
  if (!release) throw new CmsError(400, 'Choose a published, managed R2 release for this paid product.', 'PROTECTED_RELEASE_REQUIRED')
  const ttl = Math.min(10080, Math.max(5, Number(ttlMinutes) || 60))
  const uses = Math.min(100, Math.max(1, Number(maxUses) || 10))
  const token = randomToken(32)
  const tokenHash = await sha256Hex(token)
  const expiresAt = new Date(Date.now() + ttl * 60000).toISOString()
  await env.CMS_DB.prepare(`
    INSERT INTO download_tokens (token_hash, entitlement_id, release_id, expires_at, max_uses)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(tokenHash, entitlement.id, release.id, expiresAt, uses).run()
  return { token, expiresAt, maxUses: uses }
}

export async function beginPaymentEvent(env, { provider, providerEventId, eventType, verifiedPayload }) {
  const payloadSha256 = await sha256Hex(verifiedPayload)
  const id = crypto.randomUUID()
  const result = await env.CMS_DB.prepare(`
    INSERT OR IGNORE INTO payment_events (id, provider, provider_event_id, event_type, payload_sha256)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(id, provider, providerEventId, eventType, payloadSha256).run()
  if (!Number(result.meta?.changes || 0)) {
    await env.CMS_DB.prepare(`
      UPDATE payment_events SET attempt_count = attempt_count + 1 WHERE provider = ?1 AND provider_event_id = ?2
    `).bind(provider, providerEventId).run()
    return { duplicate: true, event: await env.CMS_DB.prepare('SELECT * FROM payment_events WHERE provider = ?1 AND provider_event_id = ?2').bind(provider, providerEventId).first() }
  }
  return { duplicate: false, event: await env.CMS_DB.prepare('SELECT * FROM payment_events WHERE id = ?1').bind(id).first() }
}

export async function finishPaymentEvent(env, id, status, errorMessage = null) {
  if (!new Set(['processed', 'failed', 'ignored']).has(status)) throw new CmsError(400, 'Invalid payment-event status.', 'INVALID_PAYMENT_EVENT_STATUS')
  await env.CMS_DB.prepare(`
    UPDATE payment_events SET status = ?1, processed_at = CURRENT_TIMESTAMP, error_message = ?2 WHERE id = ?3
  `).bind(status, errorMessage?.slice(0, 500) || null, id).run()
}

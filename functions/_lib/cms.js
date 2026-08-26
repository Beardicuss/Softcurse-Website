export const CONTENT_TYPES = new Set([
  'game',
  'app',
  'experiment',
  'localization',
  'chronicle',
  'blog',
  'roadmap',
])

export const CONTENT_STATUSES = new Set(['draft', 'published', 'archived'])
export const RELEASE_STATUSES = new Set(['draft', 'published', 'archived'])

export const ASSET_SPECS = {
  game: {
    card: { label: 'Card artwork', width: 1600, height: 1000, transparent: false },
    hologram: { label: 'Hologram artwork', width: 800, height: 800, transparent: true },
    hero: { label: 'Hero background', width: 1920, height: 1080, transparent: false },
  },
  app: {
    card: { label: 'Card artwork', width: 1200, height: 675, transparent: false },
    icon: { label: 'App icon', width: 512, height: 512, transparent: true },
    hero: { label: 'Hero background', width: 1920, height: 1080, transparent: false },
  },
  experiment: {
    card: { label: 'Card artwork', width: 1200, height: 675, transparent: false },
    hero: { label: 'Hero background', width: 1920, height: 1080, transparent: false },
  },
  localization: {
    card: { label: 'Project artwork', width: 1600, height: 720, transparent: false },
    hero: { label: 'Hero background', width: 1920, height: 1080, transparent: false },
  },
  chronicle: {
    card: { label: 'Cover artwork', width: 1200, height: 1800, transparent: false },
    hologram: { label: 'Character hologram', width: 800, height: 1200, transparent: true },
    hero: { label: 'Hero background', width: 1920, height: 1080, transparent: false },
  },
  blog: {
    cover: { label: 'Article cover', width: 1600, height: 900, transparent: false },
  },
  roadmap: {},
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export function apiError(status, message, code = 'REQUEST_FAILED', details) {
  return json({ ok: false, error: { code, message, ...(details ? { details } : {}) } }, { status })
}

export async function readJson(request, maxBytes = 524288) {
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > maxBytes) throw new CmsError(413, 'Request body is too large.', 'BODY_TOO_LARGE')

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new CmsError(413, 'Request body is too large.', 'BODY_TOO_LARGE')
  }

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new CmsError(400, 'Request body must be valid JSON.', 'INVALID_JSON')
  }
}

export class CmsError extends Error {
  constructor(status, message, code = 'REQUEST_FAILED', details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function handleCmsError(error, request) {
  if (error instanceof CmsError) {
    return apiError(error.status, error.message, error.code, error.details)
  }

  console.error(JSON.stringify({
    message: 'CMS request failed',
    path: new URL(request.url).pathname,
    error: error instanceof Error ? error.message : String(error),
  }))
  return apiError(500, 'The CMS request could not be completed.', 'INTERNAL_ERROR')
}

export function isSafeSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80
}

export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function sanitizeFileName(value) {
  const name = String(value || 'file')
    .normalize('NFKC')
    .split('')
    .map(character => character.charCodeAt(0) < 32 ? '-' : character)
    .join('')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
  return (name || 'file').slice(0, 160)
}

export function publicAssetUrl(assetId) {
  return `/api/assets/${encodeURIComponent(assetId)}`
}

export async function readBinary(request, maxBytes) {
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (!Number.isFinite(declaredLength) || declaredLength < 0 || declaredLength > maxBytes) {
    throw new CmsError(413, 'Upload is larger than the allowed size.', 'UPLOAD_TOO_LARGE')
  }
  const bytes = await request.arrayBuffer()
  if (!bytes.byteLength || bytes.byteLength > maxBytes) {
    throw new CmsError(bytes.byteLength ? 413 : 400, bytes.byteLength ? 'Upload is larger than the allowed size.' : 'Upload is empty.', bytes.byteLength ? 'UPLOAD_TOO_LARGE' : 'EMPTY_UPLOAD')
  }
  return bytes
}

export function parseCookies(request) {
  const raw = request.headers.get('cookie') || ''
  return Object.fromEntries(raw.split(';').map(part => {
    const index = part.indexOf('=')
    if (index < 0) return [part.trim(), '']
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())]
  }).filter(([key]) => key))
}

export function sessionCookie(token, maxAgeSeconds, secure = true) {
  return `sc_admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Strict; Max-Age=${maxAgeSeconds}`
}

export function clearSessionCookie() {
  return 'sc_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
}

export function requireSameOrigin(request) {
  const origin = request.headers.get('origin')
  const requestOrigin = new URL(request.url).origin
  if (!origin || origin !== requestOrigin) {
    throw new CmsError(403, 'Cross-origin admin requests are not allowed.', 'ORIGIN_REJECTED')
  }
}

export async function sha256Bytes(value) {
  const input = typeof value === 'string' ? new TextEncoder().encode(value) : value
  return crypto.subtle.digest('SHA-256', input)
}

export function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function sha256Hex(value) {
  return bytesToHex(await sha256Bytes(value))
}

export async function secureEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([sha256Bytes(String(left)), sha256Bytes(String(right))])
  return crypto.subtle.timingSafeEqual(leftHash, rightHash)
}

export function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function getAdminSession(request, env) {
  const token = parseCookies(request).sc_admin_session
  if (!token) return null
  const tokenHash = await sha256Hex(token)
  const session = await env.CMS_DB.prepare(`
    SELECT token_hash, username, expires_at
    FROM admin_sessions
    WHERE token_hash = ?1 AND expires_at > CURRENT_TIMESTAMP
  `).bind(tokenHash).first()
  return session ? { ...session, tokenHash } : null
}

export async function writeAudit(env, actor, action, entityType, entityId = null, metadata = null) {
  await env.CMS_DB.prepare(`
    INSERT INTO audit_log (actor, action, entity_type, entity_id, metadata_json)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(actor, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null).run()
}

export function parseContentRow(row) {
  if (!row) return null
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    data: JSON.parse(row.data_json),
  }
}

export function validateContentPayload(payload, partial = false) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new CmsError(400, 'Content must be an object.', 'INVALID_CONTENT')
  }

  if (!partial || payload.type !== undefined) {
    if (!CONTENT_TYPES.has(payload.type)) throw new CmsError(400, 'Unsupported content type.', 'INVALID_CONTENT_TYPE')
  }
  if (!partial || payload.slug !== undefined) {
    if (!isSafeSlug(payload.slug)) throw new CmsError(400, 'Slug must use lowercase letters, numbers, and single hyphens.', 'INVALID_SLUG')
  }
  if (!partial || payload.title !== undefined) {
    if (typeof payload.title !== 'string' || !payload.title.trim() || payload.title.length > 160) {
      throw new CmsError(400, 'Title is required and must be 160 characters or fewer.', 'INVALID_TITLE')
    }
  }
  if (payload.status !== undefined && !CONTENT_STATUSES.has(payload.status)) {
    throw new CmsError(400, 'Invalid publish status.', 'INVALID_STATUS')
  }
  if (payload.sortOrder !== undefined && (!Number.isInteger(payload.sortOrder) || Math.abs(payload.sortOrder) > 1000000)) {
    throw new CmsError(400, 'Sort order must be a whole number.', 'INVALID_SORT_ORDER')
  }
  if (!partial || payload.data !== undefined) {
    if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
      throw new CmsError(400, 'Content data must be an object.', 'INVALID_CONTENT_DATA')
    }
    if (JSON.stringify(payload.data).length > 700000) {
      throw new CmsError(413, 'Content data is too large.', 'CONTENT_TOO_LARGE')
    }
  }
}

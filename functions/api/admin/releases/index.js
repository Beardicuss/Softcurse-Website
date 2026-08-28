import {
  apiError,
  CmsError,
  handleCmsError,
  json,
  readJson,
  RELEASE_CHANNELS,
  RELEASE_PROVIDERS,
  RELEASE_ROLES,
  RELEASE_STATUSES,
  validateProviderUrl,
  writeAudit,
} from '../../../_lib/cms.js'
import { syncRoadmapSafely } from '../../../_lib/roadmap.js'

const PLATFORMS = new Set(['web', 'windows', 'macos', 'linux', 'android', 'ios', 'other'])
const ARCHITECTURES = new Set(['universal', 'x64', 'arm64', 'x86', 'other'])

function optionalText(value, maxLength) {
  if (value === undefined || value === null || value === '') return null
  const text = String(value).trim()
  if (text.length > maxLength) throw new CmsError(400, 'Release metadata is too long.', 'INVALID_RELEASE_METADATA')
  return text || null
}

function validateExternalRelease(payload) {
  const kind = payload?.kind
  if (kind !== 'web' && kind !== 'external') {
    throw new CmsError(400, 'Use the managed uploader for files stored by Softcurse.', 'INVALID_RELEASE_KIND')
  }
  if (!payload.contentId) throw new CmsError(400, 'A content item is required.', 'CONTENT_ID_REQUIRED')
  const label = optionalText(payload.label, 100)
  if (!label) throw new CmsError(400, 'A release label is required.', 'INVALID_RELEASE_LABEL')
  const platform = payload.platform || (kind === 'web' ? 'web' : 'other')
  if (!PLATFORMS.has(platform)) throw new CmsError(400, 'Invalid platform.', 'INVALID_PLATFORM')
  const architecture = optionalText(payload.architecture, 30)
  if (architecture && !ARCHITECTURES.has(architecture)) throw new CmsError(400, 'Invalid architecture.', 'INVALID_ARCHITECTURE')
  const provider = kind === 'web' ? 'custom' : (payload.provider || 'custom')
  if (!RELEASE_PROVIDERS.has(provider)) throw new CmsError(400, 'Invalid provider.', 'INVALID_RELEASE_PROVIDER')
  const externalUrl = validateProviderUrl(provider, payload.externalUrl)
  const actionRole = payload.actionRole || (kind === 'web' ? 'play' : 'download')
  if (!RELEASE_ROLES.has(actionRole)) throw new CmsError(400, 'Invalid release action.', 'INVALID_RELEASE_ROLE')
  const channel = payload.channel || 'stable'
  if (!RELEASE_CHANNELS.has(channel)) throw new CmsError(400, 'Invalid release channel.', 'INVALID_RELEASE_CHANNEL')
  const status = payload.status || 'draft'
  if (!RELEASE_STATUSES.has(status)) throw new CmsError(400, 'Invalid release status.', 'INVALID_RELEASE_STATUS')
  const sizeBytes = payload.sizeBytes === '' || payload.sizeBytes == null ? null : Number(payload.sizeBytes)
  if (sizeBytes !== null && (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0)) throw new CmsError(400, 'Invalid file size.', 'INVALID_FILE_SIZE')
  const sha256 = optionalText(payload.sha256, 64)
  if (sha256 && !/^[a-f0-9]{64}$/i.test(sha256)) throw new CmsError(400, 'SHA-256 must contain exactly 64 hexadecimal characters.', 'INVALID_SHA256')
  return {
    kind, label, platform, architecture, provider, externalUrl, actionRole, channel, status, sizeBytes,
    sha256: sha256?.toLowerCase() || null,
    fileName: optionalText(payload.fileName, 160),
    version: optionalText(payload.version, 60),
    releaseNotes: optionalText(payload.releaseNotes, 20000),
    isPrimary: Boolean(payload.isPrimary),
    sortOrder: Number(payload.sortOrder || 0),
  }
}

export async function onRequestGet(context) {
  const contentId = new URL(context.request.url).searchParams.get('contentId')
  if (!contentId) return apiError(400, 'contentId is required.', 'CONTENT_ID_REQUIRED')
  const rows = await context.env.CMS_DB.prepare(`
    SELECT * FROM releases WHERE content_id = ?1
    ORDER BY action_role, is_primary DESC, sort_order, created_at DESC
  `).bind(contentId).all()
  return json({ ok: true, releases: rows.results })
}

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request)
    const release = validateExternalRelease(payload)
    const content = await context.env.CMS_DB.prepare('SELECT id FROM content_items WHERE id = ?1').bind(payload.contentId).first()
    if (!content) throw new CmsError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const statements = []
    if (release.isPrimary) {
      statements.push(context.env.CMS_DB.prepare('UPDATE releases SET is_primary = 0 WHERE content_id = ?1 AND action_role = ?2').bind(payload.contentId, release.actionRole))
    }
    statements.push(context.env.CMS_DB.prepare(`
      INSERT INTO releases (id, content_id, kind, action_role, provider, label, version, channel,
        platform, architecture, external_url, file_name, size_bytes, sha256, release_notes, status,
        is_primary, sort_order, created_by, created_at, updated_at, published_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16,
        ?17, ?18, ?19, ?20, ?20, ?21)
    `).bind(id, payload.contentId, release.kind, release.actionRole, release.provider, release.label,
      release.version, release.channel, release.platform, release.architecture, release.externalUrl,
      release.fileName, release.sizeBytes, release.sha256, release.releaseNotes, release.status,
      release.isPrimary ? 1 : 0, release.sortOrder, context.data.admin.username, now,
      release.status === 'published' ? now : null))
    await context.env.CMS_DB.batch(statements)
    await writeAudit(context.env, context.data.admin.username, 'add_external_release', 'release', id, {
      contentId: payload.contentId, kind: release.kind, provider: release.provider, actionRole: release.actionRole,
    })
    const roadmapSync = await syncRoadmapSafely(context.env, context.data.admin.username, payload.contentId)
    return json({ ok: true, id, roadmapSync }, { status: 201 })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

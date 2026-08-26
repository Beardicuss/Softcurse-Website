import { apiError, CmsError, handleCmsError, json, readJson, RELEASE_STATUSES, writeAudit } from '../../../_lib/cms.js'

const PLATFORMS = new Set(['web', 'windows', 'macos', 'linux', 'android', 'ios', 'other'])

function validateWebRelease(payload) {
  if (!payload || payload.kind !== 'web') throw new CmsError(400, 'Use the installer uploader for file releases.', 'INVALID_RELEASE_KIND')
  if (!payload.contentId) throw new CmsError(400, 'A content item is required.', 'CONTENT_ID_REQUIRED')
  if (typeof payload.label !== 'string' || !payload.label.trim() || payload.label.length > 100) throw new CmsError(400, 'A release label is required.', 'INVALID_RELEASE_LABEL')
  if (!PLATFORMS.has(payload.platform || 'web')) throw new CmsError(400, 'Invalid platform.', 'INVALID_PLATFORM')
  let launchUrl
  try { launchUrl = new URL(payload.externalUrl) } catch { throw new CmsError(400, 'Enter a valid launcher URL.', 'INVALID_LAUNCH_URL') }
  if (launchUrl.protocol !== 'https:') throw new CmsError(400, 'Launcher URLs must use HTTPS.', 'INVALID_LAUNCH_URL')
  const status = payload.status || 'draft'
  if (!RELEASE_STATUSES.has(status)) throw new CmsError(400, 'Invalid release status.', 'INVALID_RELEASE_STATUS')
  return { launchUrl: launchUrl.toString(), status }
}

export async function onRequestGet(context) {
  const contentId = new URL(context.request.url).searchParams.get('contentId')
  if (!contentId) return apiError(400, 'contentId is required.', 'CONTENT_ID_REQUIRED')
  const rows = await context.env.CMS_DB.prepare(`
    SELECT * FROM releases WHERE content_id = ?1 ORDER BY is_primary DESC, sort_order, created_at DESC
  `).bind(contentId).all()
  return json({ ok: true, releases: rows.results })
}

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request)
    const { launchUrl, status } = validateWebRelease(payload)
    const content = await context.env.CMS_DB.prepare('SELECT id FROM content_items WHERE id = ?1').bind(payload.contentId).first()
    if (!content) throw new CmsError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const isPrimary = payload.isPrimary ? 1 : 0
    const statements = []
    if (isPrimary) statements.push(context.env.CMS_DB.prepare('UPDATE releases SET is_primary = 0 WHERE content_id = ?1').bind(payload.contentId))
    statements.push(context.env.CMS_DB.prepare(`
      INSERT INTO releases (id, content_id, kind, label, version, platform, architecture, external_url,
        release_notes, status, is_primary, sort_order, created_by, created_at, updated_at, published_at)
      VALUES (?1, ?2, 'web', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13, ?14)
    `).bind(id, payload.contentId, payload.label.trim(), payload.version || null, payload.platform || 'web', payload.architecture || null,
      launchUrl, payload.releaseNotes || null, status, isPrimary, Number(payload.sortOrder || 0), context.data.admin.username, now, status === 'published' ? now : null))
    await context.env.CMS_DB.batch(statements)
    await writeAudit(context.env, context.data.admin.username, 'add_web_release', 'release', id, { contentId: payload.contentId, launchUrl })
    return json({ ok: true, id }, { status: 201 })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

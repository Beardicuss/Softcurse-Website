import { apiError, CmsError, handleCmsError, json, readJson, RELEASE_STATUSES, writeAudit } from '../../../_lib/cms.js'

export async function onRequestPatch(context) {
  try {
    const release = await context.env.CMS_DB.prepare('SELECT * FROM releases WHERE id = ?1').bind(context.params.id).first()
    if (!release) return apiError(404, 'Release not found.', 'RELEASE_NOT_FOUND')
    const payload = await readJson(context.request)
    const status = payload.status ?? release.status
    if (!RELEASE_STATUSES.has(status)) throw new CmsError(400, 'Invalid release status.', 'INVALID_RELEASE_STATUS')
    let externalUrl = payload.externalUrl ?? release.external_url
    if (release.kind === 'web') {
      try { externalUrl = new URL(externalUrl).toString() } catch { throw new CmsError(400, 'Enter a valid launcher URL.', 'INVALID_LAUNCH_URL') }
      if (!externalUrl.startsWith('https://')) throw new CmsError(400, 'Launcher URLs must use HTTPS.', 'INVALID_LAUNCH_URL')
    }
    const isPrimary = payload.isPrimary === undefined ? release.is_primary : (payload.isPrimary ? 1 : 0)
    const now = new Date().toISOString()
    const statements = []
    if (isPrimary) statements.push(context.env.CMS_DB.prepare('UPDATE releases SET is_primary = 0 WHERE content_id = ?1').bind(release.content_id))
    statements.push(context.env.CMS_DB.prepare(`
      UPDATE releases SET label = ?1, version = ?2, platform = ?3, architecture = ?4,
        external_url = ?5, release_notes = ?6, status = ?7, is_primary = ?8, sort_order = ?9,
        updated_at = ?10, published_at = ?11 WHERE id = ?12
    `).bind(payload.label?.trim() || release.label, payload.version ?? release.version, payload.platform ?? release.platform,
      payload.architecture ?? release.architecture, externalUrl, payload.releaseNotes ?? release.release_notes, status,
      isPrimary, Number(payload.sortOrder ?? release.sort_order), now, status === 'published' ? (release.published_at || now) : null, release.id))
    await context.env.CMS_DB.batch(statements)
    await writeAudit(context.env, context.data.admin.username, 'update_release', 'release', release.id, { status, isPrimary: Boolean(isPrimary) })
    return json({ ok: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export async function onRequestDelete(context) {
  try {
    const release = await context.env.CMS_DB.prepare('SELECT * FROM releases WHERE id = ?1').bind(context.params.id).first()
    if (!release) return apiError(404, 'Release not found.', 'RELEASE_NOT_FOUND')
    await context.env.CMS_DB.prepare('DELETE FROM releases WHERE id = ?1').bind(release.id).run()
    if (release.r2_key) await context.env.CMS_ASSETS.delete(release.r2_key)
    await writeAudit(context.env, context.data.admin.username, 'delete_release', 'release', release.id, { contentId: release.content_id })
    return json({ ok: true, deleted: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

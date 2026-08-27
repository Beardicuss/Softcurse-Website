import {
  apiError, CmsError, handleCmsError, json, readJson, RELEASE_CHANNELS, RELEASE_PROVIDERS,
  RELEASE_ROLES, RELEASE_STATUSES, validateProviderUrl, writeAudit,
} from '../../../_lib/cms.js'

export async function onRequestPatch(context) {
  try {
    const release = await context.env.CMS_DB.prepare('SELECT * FROM releases WHERE id = ?1').bind(context.params.id).first()
    if (!release) return apiError(404, 'Release not found.', 'RELEASE_NOT_FOUND')
    const payload = await readJson(context.request)
    const status = payload.status ?? release.status
    if (!RELEASE_STATUSES.has(status)) throw new CmsError(400, 'Invalid release status.', 'INVALID_RELEASE_STATUS')
    const provider = payload.provider ?? release.provider
    if (!RELEASE_PROVIDERS.has(provider)) throw new CmsError(400, 'Invalid provider.', 'INVALID_RELEASE_PROVIDER')
    let externalUrl = payload.externalUrl ?? release.external_url
    if (release.kind === 'web' || release.kind === 'external') {
      externalUrl = validateProviderUrl(provider, externalUrl)
    }
    const actionRole = payload.actionRole ?? release.action_role
    if (!RELEASE_ROLES.has(actionRole)) throw new CmsError(400, 'Invalid release action.', 'INVALID_RELEASE_ROLE')
    const channel = payload.channel ?? release.channel
    if (!RELEASE_CHANNELS.has(channel)) throw new CmsError(400, 'Invalid release channel.', 'INVALID_RELEASE_CHANNEL')
    const isPrimary = payload.isPrimary === undefined ? release.is_primary : (payload.isPrimary ? 1 : 0)
    const now = new Date().toISOString()
    const statements = []
    if (isPrimary) statements.push(context.env.CMS_DB.prepare('UPDATE releases SET is_primary = 0 WHERE content_id = ?1 AND action_role = ?2').bind(release.content_id, actionRole))
    statements.push(context.env.CMS_DB.prepare(`
      UPDATE releases SET action_role = ?1, provider = ?2, label = ?3, version = ?4, channel = ?5,
        platform = ?6, architecture = ?7, external_url = ?8, release_notes = ?9, status = ?10,
        is_primary = ?11, sort_order = ?12, updated_at = ?13, published_at = ?14 WHERE id = ?15
    `).bind(actionRole, provider, payload.label?.trim() || release.label, payload.version ?? release.version,
      channel, payload.platform ?? release.platform, payload.architecture ?? release.architecture, externalUrl,
      payload.releaseNotes ?? release.release_notes, status, isPrimary, Number(payload.sortOrder ?? release.sort_order),
      now, status === 'published' ? (release.published_at || now) : null, release.id))
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

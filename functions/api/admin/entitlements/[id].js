import { createLicense, createProtectedDownload, ENTITLEMENT_STATUSES } from '../../../_lib/commerce.js'
import { apiError, CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

async function findEntitlement(env, id) {
  return env.CMS_DB.prepare('SELECT * FROM entitlements WHERE id = ?1').bind(id).first()
}

export async function onRequestPatch(context) {
  try {
    const entitlement = await findEntitlement(context.env, context.params.id)
    if (!entitlement) return apiError(404, 'Entitlement not found.', 'ENTITLEMENT_NOT_FOUND')
    const payload = await readJson(context.request)
    const status = String(payload.status || '')
    if (!ENTITLEMENT_STATUSES.has(status)) throw new CmsError(400, 'Invalid entitlement status.', 'INVALID_ENTITLEMENT_STATUS')
    await context.env.CMS_DB.prepare(`
      UPDATE entitlements SET status = ?1, revoked_at = CASE WHEN ?1 = 'revoked' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = ?2
    `).bind(status, entitlement.id).run()
    if (status !== 'active') {
      await context.env.CMS_DB.prepare('UPDATE download_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE entitlement_id = ?1 AND revoked_at IS NULL').bind(entitlement.id).run()
      await context.env.CMS_DB.prepare("UPDATE licenses SET status = 'revoked' WHERE entitlement_id = ?1 AND status = 'active'").bind(entitlement.id).run()
    }
    await writeAudit(context.env, context.data.admin.username, 'update_entitlement_status', 'entitlement', entitlement.id, { status })
    return json({ ok: true, entitlement: await findEntitlement(context.env, entitlement.id) })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export async function onRequestPost(context) {
  try {
    const entitlement = await findEntitlement(context.env, context.params.id)
    if (!entitlement) return apiError(404, 'Entitlement not found.', 'ENTITLEMENT_NOT_FOUND')
    const payload = await readJson(context.request)
    if (payload.action === 'issue_license') {
      const result = await createLicense(context.env, entitlement.id, {
        activationLimit: payload.activationLimit,
        expiresAt: payload.expiresAt || null,
      })
      await writeAudit(context.env, context.data.admin.username, 'issue_license', 'license', result.id, { entitlementId: entitlement.id })
      return json({ ok: true, license: result.license, notice: 'This license is shown once. Store it securely.' }, { status: 201 })
    }
    if (payload.action === 'issue_download') {
      const result = await createProtectedDownload(context.env, entitlement.id, payload.releaseId, {
        ttlMinutes: payload.ttlMinutes,
        maxUses: payload.maxUses,
      })
      await writeAudit(context.env, context.data.admin.username, 'issue_protected_download', 'entitlement', entitlement.id, { releaseId: payload.releaseId })
      return json({
        ok: true,
        url: `/api/secure-downloads/${encodeURIComponent(result.token)}`,
        expiresAt: result.expiresAt,
        maxUses: result.maxUses,
        notice: 'This download URL is shown once. Share it only with the entitled customer.',
      }, { status: 201 })
    }
    throw new CmsError(400, 'Choose a supported entitlement action.', 'INVALID_ENTITLEMENT_ACTION')
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

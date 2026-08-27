import { grantEntitlement } from '../../../_lib/commerce.js'
import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

function publicRow(row) {
  return {
    id: row.id,
    contentId: row.content_id,
    customerRef: row.customer_ref,
    status: row.status,
    source: row.source,
    note: row.note,
    orderId: row.order_id,
    grantedAt: row.granted_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    licenseCount: Number(row.license_count || 0),
    downloadTokenCount: Number(row.download_token_count || 0),
  }
}

export async function onRequestGet(context) {
  try {
    const contentId = new URL(context.request.url).searchParams.get('contentId')
    if (!contentId) throw new CmsError(400, 'A content item is required.', 'CONTENT_REQUIRED')
    const rows = await context.env.CMS_DB.prepare(`
      SELECT e.*, substr(c.email_hash, 1, 12) AS customer_ref,
        (SELECT count(*) FROM licenses l WHERE l.entitlement_id = e.id AND l.status = 'active') AS license_count,
        (SELECT count(*) FROM download_tokens d WHERE d.entitlement_id = e.id AND d.revoked_at IS NULL AND d.expires_at > CURRENT_TIMESTAMP) AS download_token_count
      FROM entitlements e JOIN customers c ON c.id = e.customer_id
      WHERE e.content_id = ?1 ORDER BY e.granted_at DESC
    `).bind(contentId).all()
    return json({ ok: true, configured: Boolean(context.env.COMMERCE_DATA_KEY), entitlements: rows.results.map(publicRow) })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request)
    const entitlement = await grantEntitlement(context.env, {
      email: payload.email,
      contentId: payload.contentId,
      source: payload.source || 'manual',
      expiresAt: payload.expiresAt || null,
      note: payload.note || null,
    })
    await writeAudit(context.env, context.data.admin.username, 'grant_entitlement', 'entitlement', entitlement.id, {
      contentId: entitlement.content_id,
      source: entitlement.source,
    })
    return json({ ok: true, entitlement: { id: entitlement.id } }, { status: 201 })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

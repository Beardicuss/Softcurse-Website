import { apiError, handleCmsError, json, writeAudit } from '../../../_lib/cms.js'

export async function onRequestDelete(context) {
  try {
    const asset = await context.env.CMS_DB.prepare('SELECT * FROM assets WHERE id = ?1').bind(context.params.id).first()
    if (!asset) return apiError(404, 'Asset not found.', 'ASSET_NOT_FOUND')
    await context.env.CMS_DB.prepare('DELETE FROM assets WHERE id = ?1').bind(asset.id).run()
    await context.env.CMS_ASSETS.delete(asset.r2_key)
    await writeAudit(context.env, context.data.admin.username, 'delete_asset', 'asset', asset.id, { contentId: asset.content_id, slot: asset.slot })
    return json({ ok: true, deleted: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

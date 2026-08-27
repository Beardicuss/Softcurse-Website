import {
  apiError,
  CHECKOUT_PROVIDERS,
  CmsError,
  handleCmsError,
  json,
  readJson,
  SALE_MODES,
  STOREFRONT_STATUSES,
  validateHttpsUrl,
  writeAudit,
} from '../../../_lib/cms.js'

function publicRow(row) {
  return {
    contentId: row.content_id,
    saleMode: row.sale_mode,
    storefrontStatus: row.storefront_status,
    priceMinor: row.price_minor,
    compareAtPriceMinor: row.compare_at_price_minor,
    currency: row.currency,
    checkoutProvider: row.checkout_provider,
    checkoutReference: row.checkout_reference,
    externalStoreUrl: row.external_store_url,
    requiresEntitlement: Boolean(row.requires_entitlement),
    updatedAt: row.updated_at,
  }
}

async function findProduct(env, contentId) {
  return env.CMS_DB.prepare('SELECT * FROM commerce_products WHERE content_id = ?1').bind(contentId).first()
}

export async function onRequestGet(context) {
  const content = await context.env.CMS_DB.prepare('SELECT id FROM content_items WHERE id = ?1').bind(context.params.id).first()
  if (!content) return apiError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')
  let product = await findProduct(context.env, content.id)
  if (!product) {
    await context.env.CMS_DB.prepare('INSERT INTO commerce_products (content_id, updated_by) VALUES (?1, ?2)').bind(content.id, context.data.admin.username).run()
    product = await findProduct(context.env, content.id)
  }
  return json({ ok: true, commerce: publicRow(product) })
}

export async function onRequestPatch(context) {
  try {
    const existing = await findProduct(context.env, context.params.id)
    if (!existing) return apiError(404, 'Commerce configuration not found.', 'COMMERCE_NOT_FOUND')
    const payload = await readJson(context.request)
    const saleMode = payload.saleMode ?? existing.sale_mode
    const storefrontStatus = payload.storefrontStatus ?? existing.storefront_status
    if (!SALE_MODES.has(saleMode)) throw new CmsError(400, 'Invalid sale mode.', 'INVALID_SALE_MODE')
    if (!STOREFRONT_STATUSES.has(storefrontStatus)) throw new CmsError(400, 'Invalid storefront status.', 'INVALID_STOREFRONT_STATUS')
    if (storefrontStatus === 'live' && context.env.COMMERCE_LIVE_ENABLED !== 'true') {
      throw new CmsError(409, 'Live sales are locked until a payment provider, legal policy, and webhook verification are configured.', 'COMMERCE_NOT_ACTIVATED')
    }
    const priceMinor = payload.priceMinor === '' || payload.priceMinor == null ? null : Number(payload.priceMinor)
    const compareAtPriceMinor = payload.compareAtPriceMinor === '' || payload.compareAtPriceMinor == null ? null : Number(payload.compareAtPriceMinor)
    if (priceMinor !== null && (!Number.isSafeInteger(priceMinor) || priceMinor < 0)) throw new CmsError(400, 'Price must be a non-negative minor-unit amount.', 'INVALID_PRICE')
    if (compareAtPriceMinor !== null && (!Number.isSafeInteger(compareAtPriceMinor) || compareAtPriceMinor < 0)) throw new CmsError(400, 'Comparison price is invalid.', 'INVALID_COMPARE_PRICE')
    const currency = String(payload.currency || existing.currency || 'USD').trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(currency)) throw new CmsError(400, 'Currency must be a three-letter ISO code.', 'INVALID_CURRENCY')
    const checkoutProvider = payload.checkoutProvider || null
    if (checkoutProvider && !CHECKOUT_PROVIDERS.has(checkoutProvider)) throw new CmsError(400, 'Invalid checkout provider.', 'INVALID_CHECKOUT_PROVIDER')
    const checkoutReference = String(payload.checkoutReference || '').trim() || null
    const externalStoreUrl = payload.externalStoreUrl ? validateHttpsUrl(payload.externalStoreUrl, 'External store URLs must use HTTPS.').toString() : null
    if (saleMode === 'paid' && storefrontStatus !== 'disabled' && (priceMinor === null || !checkoutProvider)) {
      throw new CmsError(400, 'Paid previews require a price and checkout provider.', 'INCOMPLETE_PAID_PRODUCT')
    }
    if (saleMode === 'external_store' && storefrontStatus !== 'disabled' && !externalStoreUrl) {
      throw new CmsError(400, 'External-store products require a store URL.', 'EXTERNAL_STORE_URL_REQUIRED')
    }
    const requiresEntitlement = saleMode === 'paid' && Boolean(payload.requiresEntitlement)
    const now = new Date().toISOString()
    await context.env.CMS_DB.prepare(`
      UPDATE commerce_products SET sale_mode = ?1, storefront_status = ?2, price_minor = ?3,
        compare_at_price_minor = ?4, currency = ?5, checkout_provider = ?6, checkout_reference = ?7,
        external_store_url = ?8, requires_entitlement = ?9, updated_by = ?10, updated_at = ?11
      WHERE content_id = ?12
    `).bind(saleMode, storefrontStatus, priceMinor, compareAtPriceMinor, currency, checkoutProvider,
      checkoutReference, externalStoreUrl, requiresEntitlement ? 1 : 0, context.data.admin.username,
      now, existing.content_id).run()
    await writeAudit(context.env, context.data.admin.username, 'update_commerce', 'content', existing.content_id, {
      saleMode, storefrontStatus,
    })
    return json({ ok: true, commerce: publicRow(await findProduct(context.env, existing.content_id)) })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

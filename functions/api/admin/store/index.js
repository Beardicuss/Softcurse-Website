import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

const money = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null

export async function onRequestGet(context) {
  try {
    const [products, orders, coupons, refunds, invoices, totals] = await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare(`SELECT c.id, c.title, c.type, c.status AS content_status, p.*, i.tracking_enabled, i.quantity, i.low_stock_threshold FROM commerce_products p JOIN content_items c ON c.id = p.content_id LEFT JOIN commerce_inventory i ON i.content_id = p.content_id ORDER BY c.type, c.title`),
      context.env.CMS_DB.prepare(`SELECT o.*, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count, (SELECT COALESCE(SUM(r.amount_minor), 0) FROM refunds r WHERE r.order_id = o.id) AS refund_total FROM orders o ORDER BY o.created_at DESC LIMIT 250`),
      context.env.CMS_DB.prepare('SELECT * FROM coupons ORDER BY created_at DESC'),
      context.env.CMS_DB.prepare('SELECT r.*, o.provider_order_id FROM refunds r JOIN orders o ON o.id = r.order_id ORDER BY r.created_at DESC LIMIT 100'),
      context.env.CMS_DB.prepare('SELECT i.*, o.total_minor, o.currency FROM invoices i JOIN orders o ON o.id = i.order_id ORDER BY i.created_at DESC LIMIT 100'),
      context.env.CMS_DB.prepare(`SELECT COUNT(*) AS orders, COALESCE(SUM(CASE WHEN status IN ('paid','partially_refunded','refunded') THEN total_minor ELSE 0 END), 0) AS gross, COALESCE(SUM(refunded_minor), 0) AS refunded, COUNT(DISTINCT customer_id) AS customers FROM orders`),
    ])
    const summary = totals.results[0] || {}
    return json({ ok: true, liveEnabled: context.env.COMMERCE_LIVE_ENABLED === 'true', identityConfigured: Boolean(context.env.COMMERCE_DATA_KEY), products: products.results, orders: orders.results, coupons: coupons.results, refunds: refunds.results, invoices: invoices.results, summary: { orders: Number(summary.orders || 0), gross: Number(summary.gross || 0), refunded: Number(summary.refunded || 0), customers: Number(summary.customers || 0) } })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request, 32_768)
    if (body.action === 'sandbox_order') {
      if (context.env.COMMERCE_LIVE_ENABLED === 'true') throw new CmsError(409, 'Sandbox orders cannot be created while live commerce is enabled.', 'SANDBOX_LOCKED')
      const product = await context.env.CMS_DB.prepare('SELECT p.*, c.title FROM commerce_products p JOIN content_items c ON c.id = p.content_id WHERE p.content_id = ?1').bind(String(body.contentId)).first()
      if (!product) throw new CmsError(404, 'Product not found.', 'PRODUCT_NOT_FOUND')
      const amount = money(body.totalMinor ?? product.price_minor ?? 0); if (amount === null) throw new CmsError(400, 'Invalid order total.', 'INVALID_TOTAL')
      const id = crypto.randomUUID(), providerId = `sandbox_${Date.now()}_${id.slice(0, 6)}`, currency = String(body.currency || product.currency || 'USD').toUpperCase()
      await context.env.CMS_DB.batch([
        context.env.CMS_DB.prepare("INSERT INTO orders (id, provider, provider_order_id, status, currency, total_minor) VALUES (?1, 'sandbox', ?2, ?3, ?4, ?5)").bind(id, providerId, body.status === 'pending' ? 'pending' : 'paid', currency, amount),
        context.env.CMS_DB.prepare('INSERT INTO order_items (id, order_id, content_id, quantity, unit_price_minor) VALUES (?1, ?2, ?3, 1, ?4)').bind(crypto.randomUUID(), id, product.content_id, amount),
      ])
      await writeAudit(context.env, context.data.admin.username, 'create_sandbox_order', 'order', id, { contentId: product.content_id, amount, currency })
      return json({ ok: true, id }, { status: 201 })
    }
    if (body.action === 'inventory') {
      const quantity = body.quantity === '' || body.quantity == null ? null : money(body.quantity); if (body.trackingEnabled && quantity === null) throw new CmsError(400, 'Tracked inventory needs a non-negative quantity.', 'INVALID_INVENTORY')
      await context.env.CMS_DB.prepare('INSERT INTO commerce_inventory (content_id, tracking_enabled, quantity, low_stock_threshold, updated_by) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(content_id) DO UPDATE SET tracking_enabled = excluded.tracking_enabled, quantity = excluded.quantity, low_stock_threshold = excluded.low_stock_threshold, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP').bind(String(body.contentId), body.trackingEnabled ? 1 : 0, quantity, Math.max(0, Number(body.lowStockThreshold || 0)), context.data.admin.username).run()
      await writeAudit(context.env, context.data.admin.username, 'update_inventory', 'content', String(body.contentId), { quantity, trackingEnabled: Boolean(body.trackingEnabled) }); return json({ ok: true })
    }
    if (body.action === 'coupon') {
      const code = String(body.code || '').trim().toUpperCase(); if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new CmsError(400, 'Coupon codes must contain 3–32 letters, numbers, underscores, or hyphens.', 'INVALID_COUPON_CODE')
      const type = body.discountType === 'fixed' ? 'fixed' : 'percent', value = Number(body.discountValue); if (!Number.isSafeInteger(value) || value <= 0 || (type === 'percent' && value > 100)) throw new CmsError(400, 'Coupon discount is invalid.', 'INVALID_DISCOUNT')
      const id = crypto.randomUUID(); await context.env.CMS_DB.prepare('INSERT INTO coupons (id, code, discount_type, discount_value, currency, max_redemptions, starts_at, expires_at, enabled, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9)').bind(id, code, type, type === 'fixed' ? value : value, type === 'fixed' ? String(body.currency || 'USD').toUpperCase() : null, body.maxRedemptions ? Number(body.maxRedemptions) : null, body.startsAt || null, body.expiresAt || null, context.data.admin.username).run(); await writeAudit(context.env, context.data.admin.username, 'create_coupon', 'coupon', id, { code, type, value }); return json({ ok: true, id }, { status: 201 })
    }
    if (body.action === 'toggle_coupon') { await context.env.CMS_DB.prepare('UPDATE coupons SET enabled = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2').bind(body.enabled ? 1 : 0, String(body.id)).run(); await writeAudit(context.env, context.data.admin.username, 'toggle_coupon', 'coupon', String(body.id), { enabled: Boolean(body.enabled) }); return json({ ok: true }) }
    if (body.action === 'refund') {
      const order = await context.env.CMS_DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(String(body.orderId)).first(); if (!order || !['paid', 'partially_refunded'].includes(order.status)) throw new CmsError(409, 'Only paid orders can be refunded.', 'ORDER_NOT_REFUNDABLE')
      const amount = money(body.amountMinor); if (!amount || amount > order.total_minor - order.refunded_minor) throw new CmsError(400, 'Refund exceeds the remaining refundable amount.', 'INVALID_REFUND_AMOUNT')
      const id = crypto.randomUUID(), refunded = order.refunded_minor + amount, status = refunded === order.total_minor ? 'refunded' : 'partially_refunded'
      await context.env.CMS_DB.batch([context.env.CMS_DB.prepare("INSERT INTO refunds (id, order_id, amount_minor, reason, status, created_by) VALUES (?1, ?2, ?3, ?4, 'completed', ?5)").bind(id, order.id, amount, String(body.reason || 'Administrative refund').slice(0, 500), context.data.admin.username), context.env.CMS_DB.prepare('UPDATE orders SET refunded_minor = ?1, status = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3').bind(refunded, status, order.id)]); await writeAudit(context.env, context.data.admin.username, 'record_refund', 'refund', id, { orderId: order.id, amount }); return json({ ok: true, id })
    }
    if (body.action === 'invoice') { const order = await context.env.CMS_DB.prepare('SELECT id FROM orders WHERE id = ?1').bind(String(body.orderId)).first(); if (!order) throw new CmsError(404, 'Order not found.', 'ORDER_NOT_FOUND'); const id = crypto.randomUUID(), number = `SC-${new Date().getUTCFullYear()}-${String(Date.now()).slice(-8)}`; await context.env.CMS_DB.prepare("INSERT INTO invoices (id, invoice_number, order_id, status, issued_at, created_by) VALUES (?1, ?2, ?3, 'issued', CURRENT_TIMESTAMP, ?4)").bind(id, number, order.id, context.data.admin.username).run(); await writeAudit(context.env, context.data.admin.username, 'issue_invoice', 'invoice', id, { orderId: order.id, number }); return json({ ok: true, id, number }) }
    throw new CmsError(400, 'Unknown commerce action.', 'INVALID_COMMERCE_ACTION')
  } catch (error) { return handleCmsError(error, context.request) }
}

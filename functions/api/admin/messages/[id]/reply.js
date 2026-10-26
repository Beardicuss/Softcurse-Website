import { CmsError, apiError, handleCmsError, json, readJson, writeAudit } from '../../../../_lib/cms.js'

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])

export async function onRequestPost(context) {
  try {
    const existing = await context.env.CMS_DB.prepare('SELECT * FROM contact_messages WHERE id = ?1').bind(context.params.id).first()
    if (!existing) return apiError(404, 'Message not found.', 'MESSAGE_NOT_FOUND')
    const body = await readJson(context.request, 32_768)
    const reply = String(body.reply || '').trim()
    if (!reply || reply.length > 10_000) throw new CmsError(400, 'Write a reply up to 10,000 characters.', 'INVALID_REPLY')
    if (!context.env.RESEND_API_KEY) throw new CmsError(503, 'Email delivery is not configured.', 'EMAIL_NOT_CONFIGURED')
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${context.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'User-Agent': 'softcurse-website/1.2' }, body: JSON.stringify({ from: context.env.CONTACT_FROM_EMAIL || 'Softcurse Contact <onboarding@resend.dev>', to: [existing.email], reply_to: context.env.CONTACT_TO_EMAIL || 'softcurse69@gmail.com', subject: `Re: ${existing.subject || 'Your message to Softcurse'}`, text: reply, html: `<div style="font-family:system-ui;line-height:1.65;white-space:pre-wrap">${escapeHtml(reply)}</div>` }), signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new CmsError(502, 'The reply could not be delivered.', 'REPLY_DELIVERY_FAILED')
    const delivery = await response.json().catch(() => ({}))
    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare(`UPDATE contact_messages SET status = 'replied', replied_at = CURRENT_TIMESTAMP, replied_by = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2`).bind(context.data.admin.id || null, existing.id),
      context.env.CMS_DB.prepare('INSERT INTO contact_message_events (id, message_id, action, actor, details_json) VALUES (?1, ?2, ?3, ?4, ?5)').bind(crypto.randomUUID(), existing.id, 'reply_sent', context.data.admin.username, JSON.stringify({ deliveryId: delivery.id || null, reply })),
    ])
    await writeAudit(context.env, context.data.admin.username, 'reply_to_message', 'contact_message', existing.id, { deliveryId: delivery.id || null })
    return json({ ok: true })
  } catch (error) { return handleCmsError(error, context.request) }
}

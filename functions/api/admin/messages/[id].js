import { CmsError, apiError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

const STATUSES = new Set(['new', 'read', 'replied', 'archived', 'spam'])

async function findMessage(env, id) {
  return env.CMS_DB.prepare('SELECT * FROM contact_messages WHERE id = ?1').bind(id).first()
}

export async function onRequestGet(context) {
  const message = await findMessage(context.env, context.params.id)
  if (!message) return apiError(404, 'Message not found.', 'MESSAGE_NOT_FOUND')
  const events = await context.env.CMS_DB.prepare('SELECT * FROM contact_message_events WHERE message_id = ?1 ORDER BY created_at DESC').bind(message.id).all()
  if (message.status === 'new') await context.env.CMS_DB.prepare(`UPDATE contact_messages SET status = 'read', updated_at = CURRENT_TIMESTAMP WHERE id = ?1`).bind(message.id).run()
  return json({ ok: true, message: { ...message, status: message.status === 'new' ? 'read' : message.status }, events: events.results })
}

export async function onRequestPatch(context) {
  try {
    const existing = await findMessage(context.env, context.params.id)
    if (!existing) return apiError(404, 'Message not found.', 'MESSAGE_NOT_FOUND')
    const body = await readJson(context.request, 16_384)
    const status = body.status === undefined ? existing.status : String(body.status)
    const notes = body.adminNotes === undefined ? existing.admin_notes : String(body.adminNotes).trim().slice(0, 5_000)
    if (!STATUSES.has(status)) throw new CmsError(400, 'Choose a valid message status.', 'INVALID_MESSAGE_STATUS')
    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare('UPDATE contact_messages SET status = ?1, admin_notes = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3').bind(status, notes, existing.id),
      context.env.CMS_DB.prepare('INSERT INTO contact_message_events (id, message_id, action, actor, details_json) VALUES (?1, ?2, ?3, ?4, ?5)').bind(crypto.randomUUID(), existing.id, status !== existing.status ? `status_${status}` : 'notes_updated', context.data.admin.username, JSON.stringify({ status })),
    ])
    await writeAudit(context.env, context.data.admin.username, 'update_message', 'contact_message', existing.id, { status })
    return json({ ok: true, message: await findMessage(context.env, existing.id) })
  } catch (error) { return handleCmsError(error, context.request) }
}

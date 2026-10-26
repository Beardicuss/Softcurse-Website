import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

const STATUSES = new Set(['new', 'read', 'replied', 'archived', 'spam'])

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url)
    const query = String(url.searchParams.get('q') || '').trim().slice(0, 120)
    const status = String(url.searchParams.get('status') || 'all')
    if (status !== 'all' && !STATUSES.has(status)) throw new CmsError(400, 'Unknown message status.', 'INVALID_MESSAGE_STATUS')
    const clauses = []
    const values = []
    if (status !== 'all') { values.push(status); clauses.push(`status = ?${values.length}`) }
    if (query) { values.push(`%${query}%`); clauses.push(`(name LIKE ?${values.length} OR email LIKE ?${values.length} OR subject LIKE ?${values.length} OR message LIKE ?${values.length})`) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const result = await context.env.CMS_DB.prepare(`SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT 500`).bind(...values).all()
    if (url.searchParams.get('export') === 'csv') {
      const header = ['Created', 'Status', 'Name', 'Email', 'Subject', 'Message', 'Delivery', 'Notes']
      const rows = result.results.map(row => [row.created_at, row.status, row.name, row.email, row.subject, row.message, row.delivery_status, row.admin_notes])
      return new Response([header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="softcurse-messages.csv"', 'Cache-Control': 'no-store' } })
    }
    const counts = await context.env.CMS_DB.prepare('SELECT status, COUNT(*) AS count FROM contact_messages GROUP BY status').all()
    const forms = await context.env.CMS_DB.prepare(`SELECT f.*, COUNT(m.id) AS submission_count FROM form_definitions f LEFT JOIN contact_messages m ON m.form_id = f.id GROUP BY f.id ORDER BY f.created_at`).all()
    return json({ ok: true, messages: result.results, counts: Object.fromEntries(counts.results.map(row => [row.status, Number(row.count)])), forms: forms.results.map(row => ({ ...row, submission_count: Number(row.submission_count), schema: JSON.parse(row.schema_json) })) })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPatch(context) {
  try {
    const body = await readJson(context.request, 16_384)
    const ids = Array.isArray(body.ids) ? [...new Set(body.ids.map(String))].slice(0, 100) : []
    const status = String(body.status || '')
    if (!ids.length) throw new CmsError(400, 'Select at least one message.', 'MESSAGE_IDS_REQUIRED')
    if (!STATUSES.has(status)) throw new CmsError(400, 'Choose a valid message status.', 'INVALID_MESSAGE_STATUS')
    const placeholders = ids.map((_, index) => `?${index + 2}`).join(', ')
    const result = await context.env.CMS_DB.prepare(`UPDATE contact_messages SET status = ?1, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).bind(status, ...ids).run()
    await writeAudit(context.env, context.data.admin.username, 'bulk_moderate_messages', 'contact_message', null, { status, ids })
    return json({ ok: true, updated: result.meta.changes })
  } catch (error) { return handleCmsError(error, context.request) }
}

import { COMMENT_STATUSES, cleanCommentBody } from '../../../_lib/comments.js'
import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url)
    const status = String(url.searchParams.get('status') || 'all')
    const query = String(url.searchParams.get('q') || '').trim().slice(0, 120)
    if (status !== 'all' && !COMMENT_STATUSES.has(status)) throw new CmsError(400, 'Unknown comment status.', 'INVALID_COMMENT_STATUS')
    const clauses = [], values = []
    if (status !== 'all') { values.push(status); clauses.push(`bc.status = ?${values.length}`) }
    if (query) { values.push(`%${query}%`); clauses.push(`(bc.author_name LIKE ?${values.length} OR bc.body LIKE ?${values.length} OR ci.title LIKE ?${values.length})`) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const [comments, counts] = await Promise.all([
      context.env.CMS_DB.prepare(`SELECT bc.id, bc.parent_id, bc.author_name, bc.body, bc.status, bc.created_at, bc.updated_at, ci.title AS content_title, ci.slug AS content_slug FROM blog_comments bc JOIN content_items ci ON ci.id = bc.content_id ${where} ORDER BY bc.created_at DESC LIMIT 500`).bind(...values).all(),
      context.env.CMS_DB.prepare('SELECT status, COUNT(*) AS count FROM blog_comments GROUP BY status').all(),
    ])
    return json({ ok: true, comments: comments.results, counts: Object.fromEntries(counts.results.map(row => [row.status, Number(row.count)])) })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPatch(context) {
  try {
    const body = await readJson(context.request, 16_384)
    const ids = Array.isArray(body.ids) ? [...new Set(body.ids.map(String))].slice(0, 100) : []
    const status = String(body.status || '')
    if (!ids.length) throw new CmsError(400, 'Select at least one comment.', 'COMMENT_IDS_REQUIRED')
    if (!COMMENT_STATUSES.has(status)) throw new CmsError(400, 'Choose a valid comment status.', 'INVALID_COMMENT_STATUS')
    const placeholders = ids.map((_, index) => `?${index + 3}`).join(', ')
    const result = await context.env.CMS_DB.prepare(`UPDATE blog_comments SET status = ?1, moderated_by = ?2, moderated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).bind(status, context.data.admin.id || null, ...ids).run()
    await writeAudit(context.env, context.data.admin.username, 'moderate_comments', 'blog_comment', null, { ids, status })
    return json({ ok: true, updated: result.meta.changes })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request, 8_192)
    const parent = await context.env.CMS_DB.prepare('SELECT id, content_id FROM blog_comments WHERE id = ?1').bind(String(body.parentId || '')).first()
    if (!parent) throw new CmsError(404, 'The comment no longer exists.', 'COMMENT_NOT_FOUND')
    const text = cleanCommentBody(body.body)
    const id = crypto.randomUUID()
    await context.env.CMS_DB.prepare(`INSERT INTO blog_comments (id, content_id, parent_id, author_name, body, status, moderated_by, moderated_at) VALUES (?1, ?2, ?3, ?4, ?5, 'approved', ?6, CURRENT_TIMESTAMP)`).bind(id, parent.content_id, parent.id, context.data.admin.displayName || context.data.admin.username, text, context.data.admin.id || null).run()
    await writeAudit(context.env, context.data.admin.username, 'reply_to_comment', 'blog_comment', id, { parentId: parent.id })
    return json({ ok: true, id }, { status: 201 })
  } catch (error) { return handleCmsError(error, context.request) }
}

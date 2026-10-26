import { CmsError, handleCmsError, json, readJson } from '../../_lib/cms.js'
import { cleanCommentBody, cleanCommentEmail, cleanCommentName, privateCommentHash } from '../../_lib/comments.js'

async function findPost(env, slug) {
  return env.CMS_DB.prepare("SELECT id, slug, title FROM content_items WHERE type = 'blog' AND slug = ?1 AND status = 'published'").bind(slug).first()
}

export async function onRequestGet(context) {
  try {
    const post = await findPost(context.env, context.params.slug)
    if (!post) throw new CmsError(404, 'Article not found.', 'ARTICLE_NOT_FOUND')
    const result = await context.env.CMS_DB.prepare(`
      SELECT id, parent_id, author_name, body, created_at
      FROM blog_comments WHERE content_id = ?1 AND status = 'approved'
      ORDER BY created_at ASC LIMIT 250
    `).bind(post.id).all()
    return json({ ok: true, comments: result.results.map(row => ({ id: row.id, parentId: row.parent_id, authorName: row.author_name, body: row.body, createdAt: row.created_at })) }, { headers: { 'Cache-Control': 'public, max-age=30' } })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPost(context) {
  try {
    const post = await findPost(context.env, context.params.slug)
    if (!post) throw new CmsError(404, 'Article not found.', 'ARTICLE_NOT_FOUND')
    const body = await readJson(context.request, 12_000)
    if (body.website) return json({ ok: true, pending: true }, { status: 202 })
    const authorName = cleanCommentName(body.authorName)
    const commentBody = cleanCommentBody(body.body)
    const email = cleanCommentEmail(body.email)
    const clientIp = context.request.headers.get('CF-Connecting-IP') || 'unknown'
    const ipHash = await privateCommentHash(context.env, 'ip', clientIp)
    const recent = await context.env.CMS_DB.prepare("SELECT COUNT(*) AS count FROM blog_comments WHERE ip_hash = ?1 AND created_at >= datetime('now', '-1 hour')").bind(ipHash).first()
    if (Number(recent?.count || 0) >= 5) throw new CmsError(429, 'Too many comments were submitted. Please try again later.', 'COMMENT_RATE_LIMITED')
    const id = crypto.randomUUID()
    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare(`INSERT INTO blog_comments (id, content_id, author_name, email_hash, body, ip_hash, user_agent) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`).bind(id, post.id, authorName, await privateCommentHash(context.env, 'email', email), commentBody, ipHash, String(context.request.headers.get('user-agent') || '').slice(0, 500)),
      context.env.CMS_DB.prepare(`INSERT INTO admin_notifications (id, type, title, message, action_hash) VALUES (?1, 'info', 'Comment awaiting review', ?2, 'comments')`).bind(crypto.randomUUID(), `${authorName} commented on ${post.title}`),
    ])
    return json({ ok: true, pending: true }, { status: 202 })
  } catch (error) { return handleCmsError(error, context.request) }
}

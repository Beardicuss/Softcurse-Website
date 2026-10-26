import { handleCmsError, json } from '../../_lib/cms.js'
import { can } from '../../_lib/admin-auth.js'

export async function onRequestGet(context) {
  try {
    const q = String(new URL(context.request.url).searchParams.get('q') || '').trim().slice(0, 100)
    if (q.length < 2) return json({ ok: true, results: [] })
    const like = `%${q}%`, permissions = context.data.admin.permissions, jobs = []
    if (can(permissions, 'content.view')) jobs.push(context.env.CMS_DB.prepare(`SELECT id, title, slug, type, status FROM content_items WHERE title LIKE ?1 OR slug LIKE ?1 ORDER BY updated_at DESC LIMIT 12`).bind(like).all().then(rows => rows.results.map(row => ({ id: `content-${row.id}`, label: row.title, detail: `${row.type} · ${row.status}`, hash: `edit:${row.type}:${row.id}`, group: 'Content' }))))
    if (can(permissions, 'media.view')) jobs.push(context.env.CMS_DB.prepare(`SELECT id, display_name, file_name FROM media_items WHERE display_name LIKE ?1 OR file_name LIKE ?1 ORDER BY updated_at DESC LIMIT 8`).bind(like).all().then(rows => rows.results.map(row => ({ id: `media-${row.id}`, label: row.display_name || row.file_name, detail: 'Media asset', hash: 'media', group: 'Media' }))))
    if (can(permissions, 'messages.view')) jobs.push(context.env.CMS_DB.prepare(`SELECT id, name, subject FROM contact_messages WHERE name LIKE ?1 OR email LIKE ?1 OR subject LIKE ?1 ORDER BY created_at DESC LIMIT 8`).bind(like).all().then(rows => rows.results.map(row => ({ id: `message-${row.id}`, label: row.subject || `Message from ${row.name}`, detail: row.name, hash: 'messages', group: 'Messages' }))))
    if (can(permissions, 'comments.view')) jobs.push(context.env.CMS_DB.prepare(`SELECT id, author_name, body FROM blog_comments WHERE author_name LIKE ?1 OR body LIKE ?1 ORDER BY created_at DESC LIMIT 8`).bind(like).all().then(rows => rows.results.map(row => ({ id: `comment-${row.id}`, label: `Comment by ${row.author_name}`, detail: row.body.slice(0, 90), hash: 'comments', group: 'Comments' }))))
    return json({ ok: true, results: (await Promise.all(jobs)).flat().slice(0, 30) })
  } catch (error) { return handleCmsError(error, context.request) }
}

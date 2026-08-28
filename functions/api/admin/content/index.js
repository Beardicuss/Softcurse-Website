import {
  apiError,
  CONTENT_STATUSES,
  CONTENT_TYPES,
  handleCmsError,
  json,
  parseContentRow,
  readJson,
  validateContentPayload,
  validateRoadmapData,
  writeAudit,
} from '../../../_lib/cms.js'
import { syncRoadmapSafely } from '../../../_lib/roadmap.js'

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('q')?.trim()
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))

    if (type && !CONTENT_TYPES.has(type)) return apiError(400, 'Invalid content type.', 'INVALID_CONTENT_TYPE')
    if (status && !CONTENT_STATUSES.has(status)) return apiError(400, 'Invalid status.', 'INVALID_STATUS')

    const conditions = []
    const values = []
    if (type) { conditions.push(`type = ?${values.length + 1}`); values.push(type) }
    if (status) { conditions.push(`status = ?${values.length + 1}`); values.push(status) }
    if (search) {
      conditions.push(`(title LIKE ?${values.length + 1} OR slug LIKE ?${values.length + 1})`)
      values.push(`%${search.slice(0, 100)}%`)
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const limitIndex = values.length + 1
    const offsetIndex = values.length + 2

    const [itemsResult, countResult] = await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare(`
        SELECT * FROM content_items ${where}
        ORDER BY type, sort_order, updated_at DESC
        LIMIT ?${limitIndex} OFFSET ?${offsetIndex}
      `).bind(...values, limit, offset),
      context.env.CMS_DB.prepare(`SELECT COUNT(*) AS total FROM content_items ${where}`).bind(...values),
    ])

    return json({
      ok: true,
      items: itemsResult.results.map(parseContentRow),
      total: Number(countResult.results[0]?.total || 0),
      limit,
      offset,
    })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request)
    validateContentPayload(payload)
    if (payload.type === 'roadmap') validateRoadmapData(payload.data)

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const status = payload.status || 'draft'
    const sortOrder = payload.sortOrder || 0
    const dataJson = JSON.stringify(payload.data)
    const publishedAt = status === 'published' ? now : null

    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare(`
        INSERT INTO content_items
          (id, type, slug, title, status, sort_order, data_json, created_at, updated_at, published_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8, ?9)
      `).bind(id, payload.type, payload.slug, payload.title.trim(), status, sortOrder, dataJson, now, publishedAt),
      context.env.CMS_DB.prepare(`
        INSERT INTO content_revisions (content_id, revision, action, data_json, created_by, created_at)
        VALUES (?1, 1, 'create', ?2, ?3, ?4)
      `).bind(id, dataJson, context.data.admin.username, now),
    ])

    await writeAudit(context.env, context.data.admin.username, 'create', payload.type, id, { slug: payload.slug, status })
    const roadmapSync = await syncRoadmapSafely(context.env, context.data.admin.username, payload.type === 'roadmap' ? null : id)

    const created = await context.env.CMS_DB.prepare('SELECT * FROM content_items WHERE id = ?1').bind(id).first()
    return json({ ok: true, item: parseContentRow(created), roadmapSync }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return apiError(409, 'That slug is already in use for this content type.', 'SLUG_CONFLICT')
    }
    return handleCmsError(error, context.request)
  }
}

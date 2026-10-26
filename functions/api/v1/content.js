import { apiError, json, parseContentRow } from '../../_lib/cms.js'
import { authenticateApiToken } from '../../_lib/developer.js'

export async function onRequestGet(context) {
  const token = await authenticateApiToken(context.request, context.env, 'content.read')
  if (!token) return apiError(401, 'A valid content.read bearer token is required.', 'INVALID_API_TOKEN')
  const url = new URL(context.request.url)
  const type = String(url.searchParams.get('type') || '').slice(0, 40)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)))
  const query = type ? context.env.CMS_DB.prepare("SELECT * FROM content_items WHERE status = 'published' AND type = ?1 ORDER BY sort_order, updated_at DESC LIMIT ?2").bind(type, limit) : context.env.CMS_DB.prepare("SELECT * FROM content_items WHERE status = 'published' ORDER BY type, sort_order, updated_at DESC LIMIT ?1").bind(limit)
  const result = await query.all()
  return json({ ok: true, data: result.results.map(parseContentRow), meta: { count: result.results.length, limit } }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'private, no-store' } })
}

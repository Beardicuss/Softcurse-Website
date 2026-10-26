import { json } from '../_lib/cms.js'

export async function onRequestGet(context) {
  const row = await context.env.CMS_DB.prepare("SELECT value_json, updated_at FROM settings WHERE key = 'layout'").first()
  return json({ ok: true, layout: row ? JSON.parse(row.value_json) : null, updatedAt: row?.updated_at || null }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}

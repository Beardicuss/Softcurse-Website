import { json } from '../_lib/cms.js'

export async function onRequestGet(context) {
  const result = await context.env.CMS_DB.prepare('SELECT key, enabled FROM feature_flags ORDER BY key').all()
  return json({ ok: true, flags: Object.fromEntries(result.results.map(row => [row.key, Boolean(row.enabled)])) }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}

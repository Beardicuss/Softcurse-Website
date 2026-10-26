import { json } from '../_lib/cms.js'

export async function onRequestGet(context) {
  const [flags, scripts] = await context.env.CMS_DB.batch([
    context.env.CMS_DB.prepare('SELECT key, enabled FROM feature_flags ORDER BY key'),
    context.env.CMS_DB.prepare('SELECT id, name, src, location, integrity FROM external_scripts WHERE enabled = 1 ORDER BY created_at'),
  ])
  return json({ ok: true, flags: Object.fromEntries(flags.results.map(row => [row.key, Boolean(row.enabled)])), scripts: scripts.results }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}

import { json } from '../../_lib/cms.js'

export async function onRequestGet(context) {
  const [content, releases, downloads, assets, audits] = await context.env.CMS_DB.batch([
    context.env.CMS_DB.prepare(`SELECT type, status, COUNT(*) AS count FROM content_items GROUP BY type, status`),
    context.env.CMS_DB.prepare(`SELECT kind, status, COUNT(*) AS count FROM releases GROUP BY kind, status`),
    context.env.CMS_DB.prepare(`SELECT COALESCE(SUM(download_count), 0) AS count FROM releases`),
    context.env.CMS_DB.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(size_bytes), 0) AS bytes FROM assets`),
    context.env.CMS_DB.prepare(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20`),
  ])
  return json({
    ok: true,
    content: content.results,
    releases: releases.results,
    downloads: Number(downloads.results[0]?.count || 0),
    assets: { count: Number(assets.results[0]?.count || 0), bytes: Number(assets.results[0]?.bytes || 0) },
    activity: audits.results.map(row => ({ ...row, metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null })),
  })
}

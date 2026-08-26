import { ASSET_SPECS, CONTENT_TYPES, json, parseContentRow } from '../../_lib/cms.js'

function publicRelease(row) {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    version: row.version,
    platform: row.platform,
    architecture: row.architecture,
    url: row.kind === 'web' ? row.external_url : `/api/downloads/${row.id}`,
    fileName: row.file_name,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    releaseNotes: row.release_notes,
    isPrimary: Boolean(row.is_primary),
    publishedAt: row.published_at,
  }
}

export async function onRequestGet(context) {
  const rawType = context.params.type
  const type = Array.isArray(rawType) ? rawType[0] : rawType
  if (type && !CONTENT_TYPES.has(type)) return json({ ok: false, error: { code: 'INVALID_CONTENT_TYPE', message: 'Unknown content type.' } }, { status: 404 })
  const managedQuery = type
    ? context.env.CMS_DB.prepare(`SELECT type, slug FROM content_items WHERE type = ?1`).bind(type)
    : context.env.CMS_DB.prepare(`SELECT type, slug FROM content_items`)
  const managedResult = await managedQuery.all()
  const managed = managedResult.results.map(row => `${row.type}:${row.slug}`)
  const query = type
    ? context.env.CMS_DB.prepare(`SELECT * FROM content_items WHERE status = 'published' AND type = ?1 ORDER BY sort_order, published_at DESC`).bind(type)
    : context.env.CMS_DB.prepare(`SELECT * FROM content_items WHERE status = 'published' ORDER BY type, sort_order, published_at DESC`)
  const result = await query.all()
  if (!result.results.length) return json({ ok: true, items: [], managed, assetSpecs: ASSET_SPECS }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } })
  const ids = result.results.map(row => row.id)
  const placeholders = ids.map(() => '?').join(',')
  const [assetRows, releaseRows] = await context.env.CMS_DB.batch([
    context.env.CMS_DB.prepare(`SELECT * FROM assets WHERE content_id IN (${placeholders})`).bind(...ids),
    context.env.CMS_DB.prepare(`SELECT * FROM releases WHERE status = 'published' AND content_id IN (${placeholders}) ORDER BY is_primary DESC, sort_order`).bind(...ids),
  ])
  const assets = new Map()
  for (const row of assetRows.results) {
    if (!assets.has(row.content_id)) assets.set(row.content_id, {})
    assets.get(row.content_id)[row.slot] = { id: row.id, url: `/api/assets/${row.id}`, width: row.width, height: row.height }
  }
  const releases = new Map()
  for (const row of releaseRows.results) {
    if (!releases.has(row.content_id)) releases.set(row.content_id, [])
    releases.get(row.content_id).push(publicRelease(row))
  }
  const items = result.results.map(row => ({ ...parseContentRow(row), assets: assets.get(row.id) || {}, releases: releases.get(row.id) || [] }))
  return json({ ok: true, items, managed, assetSpecs: ASSET_SPECS }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } })
}

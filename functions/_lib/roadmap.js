import { writeAudit } from './cms.js'

export const ROADMAP_SYNC_MODES = new Set(['manual', 'content', 'release'])
export const ROADMAP_ITEM_STATUSES = new Set(['done', 'in-progress', 'next', 'planned'])

const DONE_PROJECT_STATUSES = new Set(['active', 'live', 'released', 'shipped', 'complete', 'completed'])
const PLANNED_PROJECT_STATUSES = new Set(['planned', 'concept', 'idea', 'backlog', 'paused', 'on-hold'])
const NEXT_PROJECT_STATUSES = new Set(['next', 'up-next', 'up_next'])

function projectStatus(content) {
  if (!content) return null
  if (content.status === 'archived') return 'planned'
  let data = {}
  try { data = JSON.parse(content.data_json || '{}') } catch { /* invalid legacy data stays unsynced */ }
  const value = String(data.status || '').trim().toLowerCase()
  if (DONE_PROJECT_STATUSES.has(value)) return 'done'
  if (PLANNED_PROJECT_STATUSES.has(value)) return 'planned'
  if (NEXT_PROJECT_STATUSES.has(value)) return 'next'
  return value ? 'in-progress' : null
}

function projectStatusLabel(content) {
  if (!content) return ''
  try { return JSON.parse(content.data_json || '{}').status || content.status }
  catch { return content.status }
}

export function deriveRoadmapStatus(item, contentById, releaseById) {
  const mode = item.syncMode || 'manual'
  if (mode === 'manual') return { status: item.status, reason: 'Manual milestone' }

  const content = item.linkedContentId ? contentById.get(item.linkedContentId) : null
  if (mode === 'content') {
    const status = projectStatus(content)
    return status
      ? { status, reason: `Project status: ${projectStatusLabel(content)}` }
      : { status: item.status, reason: 'Linked project is missing or has no project status', warning: true }
  }

  const release = item.linkedReleaseId ? releaseById.get(item.linkedReleaseId) : null
  if (!release) {
    return {
      status: content?.status === 'archived' ? 'planned' : 'in-progress',
      reason: 'Linked release is missing',
      warning: true,
    }
  }
  if (item.linkedContentId && release.content_id !== item.linkedContentId) {
    return { status: item.status, reason: 'Linked release belongs to a different project', warning: true }
  }
  if (release.status === 'published') return { status: 'done', reason: `Release published: ${release.label}` }
  if (release.status === 'archived') return { status: 'planned', reason: `Release archived: ${release.label}` }
  return { status: 'in-progress', reason: `Release is ${release.status}: ${release.label}` }
}

async function loadContext(env) {
  const [roadmaps, contents, releases] = await env.CMS_DB.batch([
    env.CMS_DB.prepare("SELECT * FROM content_items WHERE type = 'roadmap' AND status != 'archived' ORDER BY sort_order, updated_at"),
    env.CMS_DB.prepare("SELECT id, type, slug, title, status, data_json FROM content_items WHERE type != 'roadmap' ORDER BY type, title"),
    env.CMS_DB.prepare('SELECT id, content_id, label, version, status, channel, action_role FROM releases ORDER BY content_id, published_at DESC, created_at DESC'),
  ])
  return { roadmapRows: roadmaps.results, contentRows: contents.results, releaseRows: releases.results }
}

export async function previewRoadmapSync(env, onlyContentId = null) {
  const context = await loadContext(env)
  const contentById = new Map(context.contentRows.map(row => [row.id, row]))
  const releaseById = new Map(context.releaseRows.map(row => [row.id, row]))
  const records = []
  const changes = []
  const warnings = []

  for (const row of context.roadmapRows) {
    let data
    try { data = JSON.parse(row.data_json) } catch {
      warnings.push({ roadmapId: row.id, message: 'Roadmap record contains invalid JSON.' })
      continue
    }
    let changed = false
    const nextItems = (data.items || []).map(item => {
      const linkedRelease = item.linkedReleaseId ? releaseById.get(item.linkedReleaseId) : null
      const relatedContentId = item.linkedContentId || linkedRelease?.content_id
      if (onlyContentId && relatedContentId !== onlyContentId) return item
      const result = deriveRoadmapStatus(item, contentById, releaseById)
      if (result.warning) warnings.push({ roadmapId: row.id, itemId: item.id, itemTitle: item.title, message: result.reason })
      if ((item.syncMode || 'manual') === 'manual' || result.status === item.status) return item
      changed = true
      changes.push({
        roadmapId: row.id,
        roadmapTitle: row.title,
        itemId: item.id,
        itemTitle: item.title,
        fromStatus: item.status,
        toStatus: result.status,
        reason: result.reason,
      })
      return { ...item, status: result.status }
    })
    if (changed) records.push({ row, data: { ...data, items: nextItems } })
  }

  return {
    records,
    changes,
    warnings,
    content: context.contentRows.map(row => {
      let data = {}
      try { data = JSON.parse(row.data_json || '{}') } catch { /* show record without optional metadata */ }
      return { id: row.id, type: row.type, slug: row.slug, title: row.title, status: row.status, projectStatus: data.status || '' }
    }),
    releases: context.releaseRows.map(row => ({
      id: row.id,
      contentId: row.content_id,
      label: row.label,
      version: row.version,
      status: row.status,
      channel: row.channel,
      actionRole: row.action_role,
    })),
  }
}

export async function applyRoadmapSync(env, actor, onlyContentId = null) {
  const preview = await previewRoadmapSync(env, onlyContentId)
  const now = new Date().toISOString()

  for (const record of preview.records) {
    const revision = Number(await env.CMS_DB.prepare(`
      SELECT COALESCE(MAX(revision), 0) + 1 AS next_revision
      FROM content_revisions WHERE content_id = ?1
    `).bind(record.row.id).first('next_revision'))
    const dataJson = JSON.stringify(record.data)
    await env.CMS_DB.batch([
      env.CMS_DB.prepare('UPDATE content_items SET data_json = ?1, updated_at = ?2 WHERE id = ?3')
        .bind(dataJson, now, record.row.id),
      env.CMS_DB.prepare(`
        INSERT INTO content_revisions (content_id, revision, action, data_json, created_by, created_at)
        VALUES (?1, ?2, 'roadmap_sync', ?3, ?4, ?5)
      `).bind(record.row.id, revision, dataJson, actor, now),
    ])
    const recordChanges = preview.changes.filter(change => change.roadmapId === record.row.id)
    await writeAudit(env, actor, 'roadmap_sync', 'roadmap', record.row.id, { changes: recordChanges })
  }

  return { changes: preview.changes, warnings: preview.warnings }
}

export async function syncRoadmapSafely(env, actor, onlyContentId = null) {
  try {
    const result = await applyRoadmapSync(env, actor, onlyContentId)
    return { ok: true, ...result }
  } catch (error) {
    console.error(JSON.stringify({ message: 'Roadmap synchronization failed', error: error instanceof Error ? error.message : String(error) }))
    return { ok: false, changes: [], warnings: [{ message: 'Roadmap synchronization failed. Use Sync Preview in the admin panel.' }] }
  }
}

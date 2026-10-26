import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'
import { MAX_RESTORE_BYTES, RESTORABLE_TABLES, restoreConfirmation, validateBackupDocument } from '../../../_lib/backups.js'

const EXPORT_TABLES = RESTORABLE_TABLES

async function snapshot(env) {
  const output = { format: 'softcurse-d1-backup', version: 1, createdAt: new Date().toISOString(), tables: {} }
  let recordCount = 0
  for (const table of EXPORT_TABLES) {
    const result = await env.CMS_DB.prepare(`SELECT * FROM ${table}`).all()
    output.tables[table] = result.results
    recordCount += result.results.length
  }
  return { output, recordCount }
}

async function storeSnapshot(env, actor, reason = 'manual') {
  const { output, recordCount } = await snapshot(env)
  const id = crypto.randomUUID()
  const r2Key = `backups/database-${new Date().toISOString().replaceAll(':', '-')}.json`
  const bytes = new TextEncoder().encode(JSON.stringify(output))
  await env.CMS_ASSETS.put(r2Key, bytes, { httpMetadata: { contentType: 'application/json' }, customMetadata: { createdBy: actor, recordCount: String(recordCount), reason } })
  await env.CMS_DB.prepare('INSERT INTO system_backups (id, r2_key, size_bytes, record_count, created_by) VALUES (?1, ?2, ?3, ?4, ?5)').bind(id, r2Key, bytes.byteLength, recordCount, actor).run()
  return { id, r2Key, recordCount, sizeBytes: bytes.byteLength }
}

async function readStoredBackup(env, id) {
  const backup = await env.CMS_DB.prepare("SELECT * FROM system_backups WHERE id = ?1 AND status = 'completed'").bind(id).first()
  if (!backup) throw new CmsError(404, 'Backup not found.', 'BACKUP_NOT_FOUND')
  if (Number(backup.size_bytes) > MAX_RESTORE_BYTES) throw new CmsError(413, 'The backup is too large for guarded restore.', 'BACKUP_TOO_LARGE')
  const object = await env.CMS_ASSETS.get(backup.r2_key)
  if (!object) throw new CmsError(404, 'The private backup file is missing.', 'BACKUP_FILE_MISSING')
  const text = await object.text()
  if (new TextEncoder().encode(text).byteLength > MAX_RESTORE_BYTES) throw new CmsError(413, 'The backup is too large for guarded restore.', 'BACKUP_TOO_LARGE')
  let document
  try { document = JSON.parse(text) } catch { throw new CmsError(400, 'The backup file is not valid JSON.', 'INVALID_BACKUP_JSON') }
  return { backup, ...validateBackupDocument(document) }
}

async function previewRestore(env, id) {
  const candidate = await readStoredBackup(env, id)
  const counts = await Promise.all(RESTORABLE_TABLES.map(name => env.CMS_DB.prepare(`SELECT COUNT(*) AS count FROM ${name}`).first()))
  return { backup: candidate.backup, createdAt: candidate.createdAt, recordCount: candidate.recordCount, confirmation: restoreConfirmation(id), tables: RESTORABLE_TABLES.map((name, index) => ({ name, current: Number(counts[index]?.count || 0), backup: candidate.tables[name].length })).filter(item => item.current || item.backup) }
}

async function applyRestore(env, candidate) {
  const schema = new Map()
  for (const name of RESTORABLE_TABLES) {
    const result = await env.CMS_DB.prepare(`PRAGMA table_info(${name})`).all()
    schema.set(name, new Set(result.results.map(column => column.name)))
  }
  const statements = []
  for (const name of [...RESTORABLE_TABLES].reverse()) statements.push(env.CMS_DB.prepare(`DELETE FROM ${name}`))
  for (const name of RESTORABLE_TABLES) {
    const allowed = schema.get(name)
    for (const row of candidate.tables[name]) {
      const columns = Object.keys(row)
      if (!columns.length || columns.some(column => !allowed.has(column))) throw new CmsError(400, `Backup table ${name} does not match the current schema.`, 'BACKUP_SCHEMA_MISMATCH')
      const placeholders = columns.map((_, index) => `?${index + 1}`).join(', ')
      statements.push(env.CMS_DB.prepare(`INSERT INTO ${name} (${columns.join(', ')}) VALUES (${placeholders})`).bind(...columns.map(column => row[column] ?? null)))
    }
  }
  await env.CMS_DB.batch(statements)
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url)
    if (url.searchParams.get('export') === 'database') {
      const { output } = await snapshot(context.env)
      return new Response(JSON.stringify(output, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="softcurse-database-${new Date().toISOString().slice(0, 10)}.json"`, 'Cache-Control': 'no-store' } })
    }
    const [content, administrators, messages, sessions, media, backups, events, audits, cacheState] = await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare('SELECT COUNT(*) AS count FROM content_items'),
      context.env.CMS_DB.prepare("SELECT COUNT(*) AS count FROM admin_users WHERE status = 'active'"),
      context.env.CMS_DB.prepare("SELECT COUNT(*) AS count FROM contact_messages WHERE status = 'new'"),
      context.env.CMS_DB.prepare('SELECT COUNT(*) AS count FROM admin_sessions WHERE expires_at > CURRENT_TIMESTAMP'),
      context.env.CMS_DB.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(size_bytes), 0) AS bytes FROM media_items'),
      context.env.CMS_DB.prepare('SELECT * FROM system_backups ORDER BY created_at DESC LIMIT 20'),
      context.env.CMS_DB.prepare('SELECT * FROM system_events ORDER BY created_at DESC LIMIT 50'),
      context.env.CMS_DB.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50'),
      context.env.CMS_DB.prepare("SELECT value, updated_at, updated_by FROM system_state WHERE key = 'cache_epoch'"),
    ])
    return json({ ok: true, health: { database: 'operational', storage: context.env.CMS_ASSETS ? 'operational' : 'unavailable', ai: context.env.AI ? 'available' : 'unavailable', content: Number(content.results[0]?.count || 0), administrators: Number(administrators.results[0]?.count || 0), newMessages: Number(messages.results[0]?.count || 0), activeSessions: Number(sessions.results[0]?.count || 0), mediaItems: Number(media.results[0]?.count || 0), mediaBytes: Number(media.results[0]?.bytes || 0) }, backups: backups.results, events: events.results.map(row => ({ ...row, details: row.details_json ? JSON.parse(row.details_json) : null })), audits: audits.results, cache: cacheState.results[0] || null, tasks: [{ id: 'sitemap', name: 'Dynamic sitemap', schedule: 'On request', status: 'active' }, { id: 'rss', name: 'RSS feed', schedule: 'On request', status: 'active' }, { id: 'backup', name: 'Database snapshot', schedule: 'Manual', status: 'ready' }] })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request, 4096)
    if (body.action === 'backup') {
      const backup = await storeSnapshot(context.env, context.data.admin.username)
      await context.env.CMS_DB.batch([
        context.env.CMS_DB.prepare("INSERT INTO system_events (id, level, source, message, details_json) VALUES (?1, 'info', 'backup', 'Database backup completed.', ?2)").bind(crypto.randomUUID(), JSON.stringify(backup)),
      ])
      await writeAudit(context.env, context.data.admin.username, 'create_backup', 'system_backup', backup.id, { recordCount: backup.recordCount, sizeBytes: backup.sizeBytes })
      return json({ ok: true, backup }, { status: 201 })
    }
    if (body.action === 'restore_preview') {
      return json({ ok: true, preview: await previewRestore(context.env, String(body.backupId || '')) })
    }
    if (body.action === 'restore_apply') {
      const backupId = String(body.backupId || '')
      if (body.confirmation !== restoreConfirmation(backupId)) throw new CmsError(400, 'The restore confirmation phrase does not match.', 'RESTORE_CONFIRMATION_REQUIRED')
      const candidate = await readStoredBackup(context.env, backupId)
      const recovery = await storeSnapshot(context.env, context.data.admin.username, `pre-restore:${backupId}`)
      await applyRestore(context.env, candidate)
      await context.env.CMS_DB.prepare("INSERT INTO system_events (id, level, source, message, details_json) VALUES (?1, 'warning', 'restore', 'Database backup restored.', ?2)").bind(crypto.randomUUID(), JSON.stringify({ backupId, recoveryBackupId: recovery.id, recordCount: candidate.recordCount })).run()
      await writeAudit(context.env, context.data.admin.username, 'restore_backup', 'system_backup', backupId, { recoveryBackupId: recovery.id, recordCount: candidate.recordCount })
      return json({ ok: true, restored: candidate.recordCount, recoveryBackupId: recovery.id })
    }
    if (body.action === 'clear_cache') {
      const epoch = String(Date.now())
      await context.env.CMS_DB.batch([
        context.env.CMS_DB.prepare("INSERT INTO system_state (key, value, updated_by, updated_at) VALUES ('cache_epoch', ?1, ?2, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP").bind(epoch, context.data.admin.username),
        context.env.CMS_DB.prepare("INSERT INTO system_events (id, level, source, message) VALUES (?1, 'info', 'cache', 'Application cache generation advanced.')").bind(crypto.randomUUID()),
      ])
      await writeAudit(context.env, context.data.admin.username, 'clear_cache', 'system')
      return json({ ok: true, epoch })
    }
    throw new CmsError(400, 'Unknown system action.', 'INVALID_SYSTEM_ACTION')
  } catch (error) { return handleCmsError(error, context.request) }
}

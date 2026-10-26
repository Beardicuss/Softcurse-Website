import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi, formatBytes } from './api'

const localTime = value => value ? new Date(`${value}Z`).toLocaleString() : '—'

export default function SystemManager({ canManage, canAnalytics }) {
  const [tab, setTab] = useState(canAnalytics ? 'analytics' : 'health')
  const [system, setSystem] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [restore, setRestore] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const load = useCallback(async () => {
    const [systemResult, analyticsResult] = await Promise.all([adminApi('/system'), canAnalytics ? adminApi('/analytics') : Promise.resolve(null)])
    setSystem(systemResult); setAnalytics(analyticsResult)
  }, [canAnalytics])
  useEffect(() => {
    let active = true
    Promise.all([adminApi('/system'), canAnalytics ? adminApi('/analytics') : Promise.resolve(null)])
      .then(([systemResult, analyticsResult]) => { if (active) { setSystem(systemResult); setAnalytics(analyticsResult) } })
      .catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [canAnalytics])
  const maxViews = useMemo(() => Math.max(1, ...(analytics?.timeline || []).map(item => item.views)), [analytics])
  async function action(name) {
    if (name === 'backup' && !window.confirm('Create a new database snapshot in private R2 storage?')) return
    setBusy(true); setMessage(name === 'backup' ? 'Creating backup…' : 'Advancing cache generation…')
    try { await adminApi('/system', { method: 'POST', body: JSON.stringify({ action: name }) }); setMessage(name === 'backup' ? 'Backup completed and verified in private storage.' : 'Application cache generation advanced.'); await load() }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function previewRestore(item) {
    setBusy(true); setMessage('Inspecting backup…')
    try { const result = await adminApi('/system', { method: 'POST', body: JSON.stringify({ action: 'restore_preview', backupId: item.id }) }); setRestore(result.preview); setConfirmation(''); setMessage('Backup validated. Review every table before restoring.') }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function applyRestore(event) {
    event.preventDefault(); setBusy(true); setMessage('Creating recovery snapshot and restoring database…')
    try { const result = await adminApi('/system', { method: 'POST', body: JSON.stringify({ action: 'restore_apply', backupId: restore.backup.id, confirmation }) }); setRestore(null); setConfirmation(''); setMessage(`Restore completed. ${result.restored} records restored; recovery snapshot ${result.recoveryBackupId} created.`); await load() }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  if (!system) return <div className="admin-loading">CHECKING SYSTEMS…</div>
  return <div><header className="admin-page-header"><div><p className="eyebrow">OPERATIONS CENTER</p><h1>System & analytics</h1><p className="admin-muted">First-party traffic insights, service health, backups, operational events, and audit history.</p></div><span className="system-online">● SYSTEMS ONLINE</span></header>
    {message && <p className="admin-message" role="status">{message}</p>}
    <div className="admin-tabs settings-tabs">{canAnalytics && <button className={tab === 'analytics' ? 'active' : ''} onClick={() => setTab('analytics')}>ANALYTICS</button>}<button className={tab === 'health' ? 'active' : ''} onClick={() => setTab('health')}>HEALTH</button><button className={tab === 'backups' ? 'active' : ''} onClick={() => setTab('backups')}>BACKUPS</button><button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>TASKS</button><button className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>LOGS & AUDIT</button></div>
    {tab === 'analytics' && analytics && <><div className="metric-grid system-metrics"><article><span>30-DAY VIEWS</span><strong>{analytics.totalViews}</strong><small>Privacy-safe page requests</small></article><article><span>ACTIVE DAYS</span><strong>{analytics.activeDays}</strong><small>Days with recorded traffic</small></article><article><span>TOP PAGE</span><strong>{analytics.pages[0]?.views || 0}</strong><small>{analytics.pages[0]?.path || 'No data yet'}</small></article><article><span>TOP SOURCE</span><strong>{analytics.sources[0]?.views || 0}</strong><small>{analytics.sources[0]?.source || 'No data yet'}</small></article></div><section className="admin-panel"><div className="panel-heading"><div><h2>Traffic over time</h2><span>Last 30 days · aggregated, cookie-free</span></div></div><div className="traffic-chart">{analytics.timeline.length ? analytics.timeline.map(item => <div key={item.day} title={`${item.day}: ${item.views} views`}><i style={{ height: `${Math.max(5, item.views / maxViews * 100)}%` }} /><span>{item.day.slice(5)}</span></div>) : <div className="empty-state"><strong>Analytics started today</strong><span>Traffic will appear here as visitors browse the public website.</span></div>}</div></section><div className="analytics-grid"><RankPanel title="Top pages" rows={analytics.pages} name="path" /><RankPanel title="Sources" rows={analytics.sources} name="source" /><RankPanel title="Devices" rows={analytics.devices} name="device" /><RankPanel title="Countries" rows={analytics.countries} name="country" /></div></>}
    {tab === 'health' && <><div className="health-grid">{[['D1 database', system.health.database], ['R2 storage', system.health.storage], ['Workers AI', system.health.ai]].map(([name, status]) => <article key={name}><span className={`health-dot ${status === 'operational' || status === 'available' ? 'good' : 'warning'}`} /><div><strong>{name}</strong><small>{status}</small></div></article>)}</div><section className="admin-panel"><div className="panel-heading"><h2>Resource summary</h2><span>Live database state</span></div><div className="resource-grid"><div><strong>{system.health.content}</strong><span>Content records</span></div><div><strong>{system.health.mediaItems}</strong><span>Media items</span><small>{formatBytes(system.health.mediaBytes)}</small></div><div><strong>{system.health.administrators}</strong><span>Active admins</span></div><div><strong>{system.health.activeSessions}</strong><span>Sessions</span></div><div><strong>{system.health.newMessages}</strong><span>New messages</span></div></div>{canManage && <button className="admin-button" disabled={busy} onClick={() => action('clear_cache')}>CLEAR APPLICATION CACHE</button>}</section></>}
    {tab === 'backups' && <section className="admin-panel"><div className="panel-heading"><div><h2>Database snapshots</h2><span>Stored privately in R2 · credentials and active sessions are never restored</span></div>{canManage && <button className="admin-button primary" disabled={busy} onClick={() => action('backup')}>CREATE BACKUP</button>}</div><a className="admin-button" href="/api/admin/system?export=database">EXPORT CURRENT DATABASE</a><div className="backup-list">{system.backups.map(item => <article key={item.id}><span className="status-chip published">{item.status}</span><strong>{item.record_count} records</strong><span>{formatBytes(item.size_bytes)}</span><span>{item.created_by}</span><time>{localTime(item.created_at)}</time>{canManage && <button className="admin-button" disabled={busy} onClick={() => previewRestore(item)}>INSPECT RESTORE</button>}</article>)}{!system.backups.length && <div className="empty-state"><strong>No snapshots yet</strong><span>Create the first private backup before major content changes.</span></div>}</div></section>}
    {tab === 'tasks' && <section className="admin-panel"><div className="panel-heading"><h2>Scheduled and dynamic tasks</h2><span>Cloudflare runtime</span></div><div className="task-list">{system.tasks.map(item => <article key={item.id}><span className="status-light published" /><strong>{item.name}</strong><span>{item.schedule}</span><span className="status-chip published">{item.status}</span></article>)}</div><p className="admin-muted">Automatic timed backups are not enabled on Pages yet. Manual snapshots are fully operational.</p></section>}
    {tab === 'logs' && <div className="logs-grid"><section className="admin-panel"><div className="panel-heading"><h2>System events</h2><span>Latest 50</span></div><div className="event-list">{system.events.map(item => <article key={item.id}><i className={item.level} /><span><strong>{item.message}</strong><small>{item.source} · {localTime(item.created_at)}</small></span></article>)}</div></section><section className="admin-panel"><div className="panel-heading"><h2>Administrator audit</h2><span>Latest 50</span></div><div className="event-list">{system.audits.map(item => <article key={item.id}><i /><span><strong>{item.action.replaceAll('_', ' ')}</strong><small>{item.actor} · {item.entity_type} · {localTime(item.created_at)}</small></span></article>)}</div></section></div>}
    {restore && <div className="permission-backdrop" onMouseDown={event => event.target === event.currentTarget && setRestore(null)}><form className="permission-dialog restore-dialog" onSubmit={applyRestore}><header><div><p className="eyebrow">GUARDED RESTORE</p><h2>Review snapshot changes</h2></div><button type="button" aria-label="Close restore preview" onClick={() => setRestore(null)}>×</button></header><div className="restore-warning"><strong>A recovery snapshot will be created first.</strong><span>Administrator credentials, sessions, security keys, API tokens, audit history, and system metadata will not be overwritten.</span></div><div className="restore-summary"><span>Snapshot</span><code>{restore.backup.id}</code><span>Created</span><strong>{localTime(restore.backup.created_at)}</strong><span>Records</span><strong>{restore.recordCount}</strong></div><div className="restore-table"><header><span>Table</span><span>Current</span><span>Backup</span></header>{restore.tables.map(item => <div key={item.name}><code>{item.name}</code><span>{item.current}</span><strong className={item.current !== item.backup ? 'changed' : ''}>{item.backup}</strong></div>)}</div><label>Type <code>{restore.confirmation}</code> to continue<input autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label><button className="admin-button danger" disabled={busy || confirmation !== restore.confirmation}>{busy ? 'RESTORING…' : 'CREATE RECOVERY SNAPSHOT & RESTORE'}</button></form></div>}
  </div>
}

function RankPanel({ title, rows, name }) {
  const max = Math.max(1, ...rows.map(row => row.views))
  return <section className="admin-panel rank-panel"><div className="panel-heading"><h2>{title}</h2><span>30 days</span></div>{rows.length ? rows.map(row => <div key={row[name]}><span>{row[name]}</span><i><b style={{ width: `${row.views / max * 100}%` }} /></i><strong>{row.views}</strong></div>) : <p className="admin-muted">No data yet.</p>}</section>
}

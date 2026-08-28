import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi, makeSlug } from './api'

const STATUS_OPTIONS = [
  ['planned', 'Planned'],
  ['next', 'Up next'],
  ['in-progress', 'In progress'],
  ['done', 'Done'],
]

const SYNC_OPTIONS = [
  ['manual', 'Manual status'],
  ['content', 'Follow project status'],
  ['release', 'Follow a release'],
]

function newMilestone(index) {
  return { id: `milestone-${index + 1}`, title: '', type: 'LAB', status: 'planned', desc: '', syncMode: 'manual' }
}

export default function RoadmapEditor({ items = [], onChange, isNew, onSynced }) {
  const [context, setContext] = useState({ content: [], releases: [], changes: [], warnings: [] })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const loadPreview = useCallback(async () => {
    try {
      const result = await adminApi('/roadmap-sync')
      setContext(result)
      setMessage('')
    } catch (error) { setMessage(error.message) }
  }, [])

  useEffect(() => {
    let active = true
    adminApi('/roadmap-sync')
      .then(result => { if (active) setContext(result) })
      .catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [])

  const contentById = useMemo(() => new Map(context.content.map(item => [item.id, item])), [context.content])
  const update = (index, patch) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  const remove = index => onChange(items.filter((_, itemIndex) => itemIndex !== index))
  const move = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  async function syncNow() {
    if (isNew) return
    setBusy(true); setMessage('Synchronizing…')
    try {
      const result = await adminApi('/roadmap-sync', { method: 'POST', body: '{}' })
      setMessage(result.changes.length ? `${result.changes.length} milestone status change${result.changes.length === 1 ? '' : 's'} applied.` : 'Roadmap is already synchronized.')
      await loadPreview()
      await onSynced?.()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  return <div className="wide roadmap-editor">
    <div className="roadmap-editor-heading">
      <div><strong>MILESTONES</strong><span>Add records manually or link them to projects and releases.</span></div>
      <div><button type="button" className="admin-button" onClick={loadPreview}>REFRESH PREVIEW</button><button type="button" className="admin-button primary" disabled={busy || isNew} onClick={syncNow}>{busy ? 'SYNCING…' : 'SYNC ALL NOW'}</button></div>
    </div>
    {isNew && <p className="roadmap-notice">Save this roadmap period once before running synchronization.</p>}
    {context.changes.length > 0 && <div className="roadmap-sync-preview"><strong>{context.changes.length} pending automatic change{context.changes.length === 1 ? '' : 's'}</strong>{context.changes.map(change => <span key={`${change.roadmapId}-${change.itemId}`}>{change.itemTitle}: {change.fromStatus} → {change.toStatus}</span>)}</div>}
    {context.warnings.length > 0 && <div className="roadmap-sync-warnings"><strong>LINK WARNINGS</strong>{context.warnings.map((warning, index) => <span key={`${warning.roadmapId || 'global'}-${warning.itemId || index}`}>{warning.itemTitle ? `${warning.itemTitle}: ` : ''}{warning.message}</span>)}</div>}
    {message && <p className="admin-message" role="status">{message}</p>}
    <div className="roadmap-milestones">
      {items.length === 0 && <div className="empty-state"><strong>No milestones in this period</strong><span>Add one below. Existing roadmap periods can remain fully manual.</span></div>}
      {items.map((item, index) => {
        const mode = item.syncMode || 'manual'
        const releases = context.releases.filter(release => !item.linkedContentId || release.contentId === item.linkedContentId)
        const linkedProject = contentById.get(item.linkedContentId)
        return <article className="roadmap-milestone" key={`${item.id || 'milestone'}-${index}`}>
          <div className="roadmap-milestone-title"><span>#{index + 1}</span><strong>{item.title || 'Untitled milestone'}</strong><div><button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move milestone up">↑</button><button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label="Move milestone down">↓</button><button type="button" className="danger" onClick={() => remove(index)}>REMOVE</button></div></div>
          <div className="roadmap-milestone-grid">
            <label>Title<input required value={item.title || ''} onChange={event => update(index, { title: event.target.value, ...(!item.id || item.id.startsWith('milestone-') ? { id: makeSlug(event.target.value) || item.id } : {}) })} /></label>
            <label>Record ID<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={item.id || ''} onChange={event => update(index, { id: makeSlug(event.target.value) })} /></label>
            <label>Area<select value={item.type || 'LAB'} onChange={event => update(index, { type: event.target.value })}><option value="LAB">LAB</option><option value="STUDIO">STUDIO</option></select></label>
            <label>Status<select disabled={mode !== 'manual'} value={item.status || 'planned'} onChange={event => update(index, { status: event.target.value })}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>{mode === 'manual' ? 'You control this status.' : 'Calculated when linked data changes.'}</small></label>
            <label>Automation<select value={mode} onChange={event => { const syncMode = event.target.value; update(index, { syncMode, ...(syncMode === 'manual' ? { linkedContentId: undefined, linkedReleaseId: undefined } : {}), ...(syncMode === 'content' ? { linkedReleaseId: undefined } : {}) }) }}>{SYNC_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {mode !== 'manual' && <label>Linked project<select required value={item.linkedContentId || ''} onChange={event => update(index, { linkedContentId: event.target.value, linkedReleaseId: undefined })}><option value="">Choose a project…</option>{context.content.map(content => <option key={content.id} value={content.id}>{content.title} ({content.type}{content.projectStatus ? ` · ${content.projectStatus}` : ''})</option>)}</select>{linkedProject && <small>Current CMS state: {linkedProject.status}</small>}</label>}
            {mode === 'release' && <label className="wide">Linked release<select required value={item.linkedReleaseId || ''} onChange={event => update(index, { linkedReleaseId: event.target.value })}><option value="">Choose a release…</option>{releases.map(release => <option key={release.id} value={release.id}>{release.label}{release.version ? ` · v${release.version}` : ''} ({release.status})</option>)}</select></label>}
            <label className="wide">Description<textarea rows="3" value={item.desc || ''} onChange={event => update(index, { desc: event.target.value })} /></label>
          </div>
        </article>
      })}
    </div>
    <button type="button" className="admin-button roadmap-add" onClick={() => onChange([...items, newMilestone(items.length)])}>+ ADD MILESTONE</button>
  </div>
}

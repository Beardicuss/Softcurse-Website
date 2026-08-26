import { useCallback, useEffect, useMemo, useState } from 'react'
import AssetManager from './AssetManager'
import ReleaseManager from './ReleaseManager'
import { adminApi, formatBytes, makeSlug } from './api'
import './admin.css'

const LABELS = { game: 'Games', app: 'Apps', experiment: 'Experiments', localization: 'Localization', chronicle: 'Chronicles', blog: 'Blog', roadmap: 'Roadmap' }
const EMPTY_DATA = { shortDesc: '', desc: '', icon: '◈', tag: '', status: 'dev', features: [], platforms: [], techStack: [] }

function Login({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { const result = await adminApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }); onLogin(result.user) }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  return <main className="admin-login">
    <section className="login-panel">
      <div className="admin-brand-mark">SC<span>SYS</span></div>
      <p className="eyebrow">SOFTCURSE SYSTEMS</p><h1>CONTROL PANEL</h1><p className="admin-muted">Manage published work, visual assets, launchers, and releases.</p>
      <form onSubmit={submit}><label>Operator<input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} /></label><label>Access key<input autoComplete="current-password" type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="admin-button primary" disabled={busy}>{busy ? 'AUTHENTICATING…' : 'ENTER CONTROL PANEL'}</button></form>
      <a href="/">← Return to website</a>
    </section>
  </main>
}

function Dashboard({ onSelect }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { adminApi('/dashboard').then(setData).catch(errorValue => setError(errorValue.message)) }, [])
  const total = data?.content.reduce((sum, row) => sum + Number(row.count), 0) || 0
  const published = data?.content.filter(row => row.status === 'published').reduce((sum, row) => sum + Number(row.count), 0) || 0
  return <div><header className="admin-page-header"><div><p className="eyebrow">SYSTEM OVERVIEW</p><h1>Dashboard</h1></div><span className="system-online">● CMS ONLINE</span></header>
    {error && <p className="admin-error">{error}</p>}
    <div className="metric-grid"><article><span>CONTENT ITEMS</span><strong>{total}</strong></article><article><span>PUBLISHED</span><strong>{published}</strong></article><article><span>ASSET STORAGE</span><strong>{formatBytes(data?.assets.bytes)}</strong><small>{data?.assets.count || 0} images</small></article><article><span>DOWNLOADS</span><strong>{data?.downloads || 0}</strong></article></div>
    <section className="admin-panel"><div className="panel-heading"><h2>Content modules</h2><span>Create, edit, publish</span></div><div className="module-grid">{Object.entries(LABELS).map(([type, label]) => { const count = data?.content.filter(row => row.type === type).reduce((sum, row) => sum + Number(row.count), 0) || 0; return <button key={type} onClick={() => onSelect(type)}><span>{label}</span><strong>{count}</strong><small>OPEN MODULE →</small></button> })}</div></section>
    <section className="admin-panel"><div className="panel-heading"><h2>Recent activity</h2><span>Audit trail</span></div><div className="activity-list">{!data?.activity?.length && <p className="admin-muted">No recorded activity yet.</p>}{data?.activity.map(row => <div key={row.id}><span className="activity-dot" /><strong>{row.action.replaceAll('_', ' ')}</strong><span>{row.entity_type}</span><time>{new Date(`${row.created_at}Z`).toLocaleString()}</time></div>)}</div></section>
  </div>
}

function ContentList({ type, onEdit, onCreate }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [error, setError] = useState('')
  const load = useCallback(() => {
    const params = new URLSearchParams({ type, q: search })
    if (status !== 'all') params.set('status', status)
    return adminApi(`/content?${params}`).then(result => { setItems(result.items); setError('') }).catch(errorValue => setError(errorValue.message))
  }, [search, status, type])
  useEffect(() => { const timer = setTimeout(load, 180); return () => clearTimeout(timer) }, [load])
  return <div><header className="admin-page-header"><div><p className="eyebrow">CONTENT MODULE</p><h1>{LABELS[type]}</h1></div><button className="admin-button primary" onClick={onCreate}>+ NEW {type.toUpperCase()}</button></header>
    <div className="list-toolbar"><input aria-label="Search" placeholder={`Search ${LABELS[type].toLowerCase()}…`} value={search} onChange={event => setSearch(event.target.value)} /><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All states</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
    {error && <p className="admin-error">{error}</p>}<section className="admin-panel content-table">{items.length === 0 ? <div className="empty-state"><strong>No {LABELS[type].toLowerCase()} found</strong><span>Create the first item or change the filters.</span></div> : items.map(item => <button key={item.id} onClick={() => onEdit(item.id)}><span className={`status-light ${item.status}`} /><div><strong>{item.title}</strong><small>/{item.slug}</small></div><span>{item.status}</span><time>{new Date(item.updatedAt).toLocaleDateString()}</time><b>EDIT →</b></button>)}</section>
  </div>
}

function CoreFields({ value, setValue, isNew }) {
  const data = value.data
  const [advanced, setAdvanced] = useState(false)
  const [advancedText, setAdvancedText] = useState(() => JSON.stringify(data, null, 2))
  const update = (key, next) => setValue({ ...value, [key]: next })
  const updateData = (key, next) => setValue({ ...value, data: { ...data, [key]: next } })
  const listField = (key, text) => updateData(key, text.split('\n').map(line => line.trim()).filter(Boolean))
  return <div className="admin-form-grid">
    <label>Title<input required value={value.title} onChange={event => { const title = event.target.value; setValue({ ...value, title, ...(isNew && !value.slugTouched ? { slug: makeSlug(title) } : {}) }) }} /></label>
    <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={value.slug} onChange={event => setValue({ ...value, slug: makeSlug(event.target.value), slugTouched: true })} /></label>
    <label>Publish state<select value={value.status} onChange={event => update('status', event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
    <label>Display order<input type="number" value={value.sortOrder} onChange={event => update('sortOrder', Number(event.target.value))} /></label>
    <label>Icon / glyph<input value={data.icon || ''} onChange={event => updateData('icon', event.target.value)} /></label>
    <label>Category tag<input value={data.tag || ''} onChange={event => updateData('tag', event.target.value)} /></label>
    <label>Project status<input placeholder="active, beta, dev, planned" value={data.status || ''} onChange={event => updateData('status', event.target.value)} /></label>
    <label>Version<input value={data.version || ''} onChange={event => updateData('version', event.target.value)} /></label>
    <label className="wide">Short description<textarea rows="3" value={data.shortDesc || ''} onChange={event => updateData('shortDesc', event.target.value)} /></label>
    <label className="wide">Full description<textarea rows="7" value={data.desc || ''} onChange={event => updateData('desc', event.target.value)} /></label>
    {value.type === 'blog' && <>
      <label>Category<input value={data.category || ''} onChange={event => updateData('category', event.target.value)} /></label>
      <label>Publication date<input type="date" value={data.date || ''} onChange={event => updateData('date', event.target.value)} /></label>
      <label>Reading time<input placeholder="7 min" value={data.readTime || ''} onChange={event => updateData('readTime', event.target.value)} /></label>
      <label className="wide">Article excerpt<textarea rows="3" value={data.excerpt || ''} onChange={event => updateData('excerpt', event.target.value)} /></label>
      <label className="wide">Article body <small>Markdown supported</small><textarea rows="18" value={data.content || ''} onChange={event => updateData('content', event.target.value)} /></label>
    </>}
    {value.type === 'roadmap' && <>
      <label>Quarter / period<input value={data.quarter || ''} onChange={event => updateData('quarter', event.target.value)} /></label>
      <label className="wide">Roadmap entries <small>JSON array: id, title, type, status, desc</small><textarea rows="12" value={JSON.stringify(data.items || [], null, 2)} onChange={event => { try { updateData('items', JSON.parse(event.target.value)) } catch { /* preserve the last valid value */ } }} /></label>
    </>}
    <label>Platforms <small>one per line</small><textarea rows="6" value={(data.platforms || []).join('\n')} onChange={event => listField('platforms', event.target.value)} /></label>
    <label>Technology <small>one per line</small><textarea rows="6" value={(data.techStack || []).join('\n')} onChange={event => listField('techStack', event.target.value)} /></label>
    <label className="wide">Features <small>one per line</small><textarea rows="8" value={(data.features || []).join('\n')} onChange={event => listField('features', event.target.value)} /></label>
    <div className="wide advanced-editor"><button type="button" className="admin-button" onClick={() => { setAdvanced(!advanced); setAdvancedText(JSON.stringify(data, null, 2)) }}>{advanced ? 'HIDE' : 'SHOW'} ADVANCED DATA</button>{advanced && <><p className="admin-muted">Full structured record for specialized fields, chapters, metadata, and future modules.</p><textarea rows="20" value={advancedText} onChange={event => setAdvancedText(event.target.value)} /><button type="button" className="admin-button" onClick={() => { try { setValue({ ...value, data: JSON.parse(advancedText) }) } catch { window.alert('Advanced data is not valid JSON.') } }}>APPLY VALID JSON</button></>}</div>
  </div>
}

function ContentEditor({ type, id, schema, onBack }) {
  const isNew = !id
  const [item, setItem] = useState(isNew ? { type, title: '', slug: '', status: 'draft', sortOrder: 0, data: EMPTY_DATA } : null)
  const [assets, setAssets] = useState([])
  const [releases, setReleases] = useState([])
  const [tab, setTab] = useState('content')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { if (!id) return; const result = await adminApi(`/content/${id}`); setItem(result.item); setAssets(result.assets.map(asset => ({ ...asset, url: `/api/assets/${asset.id}` }))); setReleases(result.releases) }, [id])
  useEffect(() => {
    if (!id) return undefined
    let active = true
    adminApi(`/content/${id}`)
      .then(result => {
        if (!active) return
        setItem(result.item)
        setAssets(result.assets.map(asset => ({ ...asset, url: `/api/assets/${asset.id}` })))
        setReleases(result.releases)
      })
      .catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [id])
  async function save(event) {
    event?.preventDefault(); setBusy(true); setMessage('Saving…')
    try {
      const payload = { type: item.type, title: item.title, slug: item.slug, status: item.status, sortOrder: item.sortOrder, data: item.data }
      const result = await adminApi(isNew ? '/content' : `/content/${id}`, { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(payload) })
      setMessage(isNew ? 'Created. Opening full editor…' : 'Changes saved.')
      if (isNew) window.location.hash = `edit:${type}:${result.item.id}`
      else setItem(result.item)
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function archive() {
    if (!window.confirm('Archive this item? It will disappear from the public website.')) return
    try { await adminApi(`/content/${id}`, { method: 'DELETE' }); onBack() } catch (error) { setMessage(error.message) }
  }
  if (!item) return <div className="admin-loading">LOADING RECORD…</div>
  return <div><header className="admin-page-header editor-header"><div><button className="back-button" onClick={onBack}>← {LABELS[type]}</button><h1>{isNew ? `New ${type}` : item.title}</h1><span className={`status-chip ${item.status}`}>{item.status}</span></div><div>{!isNew && <button className="admin-button danger" onClick={archive}>ARCHIVE</button>}<button className="admin-button primary" disabled={busy} onClick={save}>{busy ? 'SAVING…' : 'SAVE CHANGES'}</button></div></header>
    {!isNew && <div className="admin-tabs editor-tabs" role="tablist" aria-label="Content editor sections"><button role="tab" aria-selected={tab === 'content'} className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>CONTENT</button><button role="tab" aria-selected={tab === 'assets'} className={tab === 'assets' ? 'active' : ''} onClick={() => setTab('assets')}>VISUAL ASSETS <span>{assets.length}</span></button><button role="tab" aria-selected={tab === 'releases'} className={tab === 'releases' ? 'active' : ''} onClick={() => setTab('releases')}>LAUNCHERS & FILES <span>{releases.length}</span></button></div>}
    <section className="admin-panel editor-panel">{tab === 'content' && <form onSubmit={save}><CoreFields value={item} setValue={setItem} isNew={isNew} /></form>}{tab === 'assets' && <AssetManager item={item} specs={schema.assetSpecs[type] || {}} assets={assets} onChanged={load} />}{tab === 'releases' && <ReleaseManager item={item} releases={releases} schema={schema} onChanged={load} />}</section>
    {message && <div className="admin-toast" role="status" aria-live="polite">{message}</div>}
  </div>
}

function parseView() {
  const value = window.location.hash.slice(1)
  if (value.startsWith('module:')) return { page: 'module', type: value.split(':')[1] }
  if (value.startsWith('new:')) return { page: 'new', type: value.split(':')[1] }
  if (value.startsWith('edit:')) { const [, type, id] = value.split(':'); return { page: 'edit', type, id } }
  return { page: 'dashboard' }
}

export default function AdminApp() {
  const [user, setUser] = useState(undefined)
  const [schema, setSchema] = useState(null)
  const [view, setView] = useState(parseView)
  useEffect(() => { adminApi('/auth/session').then(result => setUser(result.user)).catch(() => setUser(null)) }, [])
  useEffect(() => { if (user) adminApi('/schema').then(setSchema).catch(() => setUser(null)) }, [user])
  useEffect(() => { const change = () => setView(parseView()); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change) }, [])
  const navigate = useCallback(value => { window.location.hash = value }, [])
  const title = useMemo(() => view.type ? LABELS[view.type] : 'Dashboard', [view.type])
  useEffect(() => { document.title = `${title} — Softcurse Control` }, [title])
  useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots) }
    robots.content = 'noindex, nofollow'
  }, [])
  async function logout() { await adminApi('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null) }
  if (user === undefined) return <div className="admin-loading full">INITIALIZING CONTROL SYSTEM…</div>
  if (!user) return <Login onLogin={setUser} />
  if (!schema) return <div className="admin-loading full">LOADING CMS SCHEMA…</div>
  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-logo" href="#" onClick={() => navigate('')}><b>SOFTCURSE</b><span>CONTROL // v1.0</span></a><nav><button className={view.page === 'dashboard' ? 'active' : ''} onClick={() => navigate('')}>⌂ <span>Dashboard</span></button><p>CONTENT</p>{Object.entries(LABELS).map(([type, label]) => <button key={type} className={view.type === type ? 'active' : ''} onClick={() => navigate(`module:${type}`)}>◇ <span>{label}</span></button>)}</nav><div className="admin-operator"><span>● ONLINE</span><strong>{user.username}</strong><button onClick={logout}>SIGN OUT</button></div></aside>
    <main className="admin-main">{view.page === 'dashboard' && <Dashboard onSelect={type => navigate(`module:${type}`)} />}{view.page === 'module' && <ContentList type={view.type} onCreate={() => navigate(`new:${view.type}`)} onEdit={id => navigate(`edit:${view.type}:${id}`)} />}{(view.page === 'new' || view.page === 'edit') && <ContentEditor type={view.type} id={view.id} schema={schema} onBack={() => navigate(`module:${view.type}`)} />}</main>
  </div>
}

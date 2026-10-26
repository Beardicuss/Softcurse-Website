import { useCallback, useEffect, useMemo, useState } from 'react'
import AssetManager from './AssetManager'
import ReleaseManager from './ReleaseManager'
import CommerceManager from './CommerceManager'
import ChapterManager from './ChapterManager'
import RoadmapEditor from './RoadmapEditor'
import CommandPalette from './CommandPalette'
import DataTable from './DataTable'
import UserManager from './UserManager'
import SecurityManager, { PasswordChange } from './SecurityManager'
import AiAssistant from './AiAssistant'
import NotificationCenter from './NotificationCenter'
import MediaLibrary from './MediaLibrary'
import SettingsManager from './SettingsManager'
import MessageInbox from './MessageInbox'
import SystemManager from './SystemManager'
import LayoutManager from './LayoutManager'
import DeveloperTools from './DeveloperTools'
import StoreManager from './StoreManager'
import CommentManager from './CommentManager'
import OnboardingTour from './OnboardingTour'
import { adminApi, formatBytes, makeSlug } from './api'
import './admin.css'
import './layout.css'
import './developer.css'
import './store.css'
import './hardening.css'
import './restore.css'
import './accessibility.css'

const LABELS = { game: 'Games', app: 'Apps', experiment: 'Experiments', localization: 'Localization', chronicle: 'Chronicles', blog: 'Blog', roadmap: 'Roadmap' }
const EMPTY_DATA = { shortDesc: '', desc: '', icon: '◈', tag: '', status: 'dev', features: [], platforms: [], techStack: [] }
const initialData = type => type === 'roadmap' ? { quarter: '', items: [] } : { ...EMPTY_DATA, features: [], platforms: [], techStack: [] }
const editorSignature = item => item ? JSON.stringify({ type: item.type, title: item.title, slug: item.slug, status: item.status, sortOrder: item.sortOrder, data: item.data }) : ''

function Login({ onLogin }) {
  const [username, setUsername] = useState('softcurse')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { const result = await adminApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, ...(twoFactor ? { totpCode } : {}) }) }); if (result.twoFactorRequired) { setTwoFactor(true); setError(''); return } onLogin(result.user) }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }
  return <main className="admin-login">
    <section className="login-panel">
      <div className="admin-brand-mark">SC<span>SYS</span></div>
      <p className="eyebrow">SOFTCURSE SYSTEMS</p><h1>CONTROL PANEL</h1><p className="admin-muted">Manage published work, visual assets, launchers, and releases.</p>
      <form onSubmit={submit}><label>Operator<input autoComplete="username" disabled={twoFactor} value={username} onChange={event => setUsername(event.target.value)} /></label><label>Access key<input autoComplete="current-password" disabled={twoFactor} type="password" value={password} onChange={event => setPassword(event.target.value)} /></label>{twoFactor && <label>Authenticator or recovery code<input autoFocus required inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={totpCode} onChange={event => setTotpCode(event.target.value.trim())} /></label>}{error && <p className="admin-error" role="alert">{error}</p>}<button className="admin-button primary" disabled={busy}>{busy ? 'AUTHENTICATING…' : twoFactor ? 'VERIFY CODE' : 'ENTER CONTROL PANEL'}</button>{twoFactor && <button type="button" className="admin-button" onClick={() => { setTwoFactor(false); setTotpCode(''); setPassword('') }}>USE ANOTHER ACCOUNT</button>}</form>
      <a href="/">← Return to website</a>
    </section>
  </main>
}

function Dashboard({ onSelect, user }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { adminApi('/dashboard').then(setData).catch(errorValue => setError(errorValue.message)) }, [])
  const total = data?.content.reduce((sum, row) => sum + Number(row.count), 0) || 0
  const published = data?.content.filter(row => row.status === 'published').reduce((sum, row) => sum + Number(row.count), 0) || 0
  const maxModuleCount = Math.max(1, ...Object.keys(LABELS).map(type => data?.content.filter(row => row.type === type).reduce((sum, row) => sum + Number(row.count), 0) || 0))
  return <div><header className="admin-page-header dashboard-welcome"><div><p className="eyebrow">SYSTEM OVERVIEW</p><h1>Welcome back, {user.displayName || user.username}</h1><p className="admin-muted">Here is what is happening across Softcurse.</p></div><span className="system-online">● ALL SYSTEMS OPERATIONAL</span></header>
    {error && <p className="admin-error">{error}</p>}
    <div className="metric-grid"><article><span>CONTENT ITEMS</span><strong>{total}</strong><small>{data?.drafts || 0} drafts need attention</small></article><article><span>PUBLISHED</span><strong>{published}</strong><small>{total ? Math.round(published / total * 100) : 0}% of all content</small></article><article><span>ASSET STORAGE</span><strong>{formatBytes(data?.assets.bytes)}</strong><small>{data?.assets.count || 0} managed images</small></article><article><span>DOWNLOADS</span><strong>{data?.downloads || 0}</strong><small>{data?.activeSessions || 0} active admin sessions</small></article></div>
    <section className="dashboard-grid"><div className="admin-panel"><div className="panel-heading"><h2>Content distribution</h2><span>All records</span></div><div className="mini-chart">{Object.entries(LABELS).map(([type, label]) => { const count = data?.content.filter(row => row.type === type).reduce((sum, row) => sum + Number(row.count), 0) || 0; return <button key={type} onClick={() => onSelect(type)}><span>{label}</span><i><b style={{ width: `${Math.max(4, count / maxModuleCount * 100)}%` }} /></i><strong>{count}</strong></button> })}</div></div>
      <div className="admin-panel quick-actions"><div className="panel-heading"><h2>Quick actions</h2><span>Common tasks</span></div><button onClick={() => onSelect('blog', true)}>＋ <span><strong>New article</strong><small>Start a blog draft</small></span></button><button onClick={() => onSelect('app', true)}>◇ <span><strong>Add application</strong><small>Create a product record</small></span></button><button onClick={() => onSelect('roadmap')}>↗ <span><strong>Update roadmap</strong><small>Review milestones</small></span></button></div></section>
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
  const columns = [
    { key: 'title', label: 'Content', render: item => <div className="table-title"><span className={`status-light ${item.status}`} /><span><strong>{item.title}</strong><small>/{item.slug}</small></span></div> },
    { key: 'status', label: 'State', render: item => <span className={`status-chip ${item.status}`}>{item.status}</span> },
    { key: 'updatedAt', label: 'Updated', render: item => <time>{new Date(item.updatedAt).toLocaleDateString()}</time> },
    { key: 'action', label: '', render: () => <b className="table-action">EDIT →</b> },
  ]
  return <div><header className="admin-page-header"><div><p className="eyebrow">CONTENT MODULE</p><h1>{LABELS[type]}</h1><p className="admin-muted">Create, organize, and publish {LABELS[type].toLowerCase()}.</p></div><button className="admin-button primary" onClick={onCreate}>+ NEW {type.toUpperCase()}</button></header>
    <div className="list-toolbar"><input aria-label="Search" placeholder={`Search ${LABELS[type].toLowerCase()}…`} value={search} onChange={event => setSearch(event.target.value)} /><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All states</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
    {error && <p className="admin-error">{error}</p>}<section className="admin-panel content-table"><DataTable columns={columns} rows={items} onRowClick={item => onEdit(item.id)} emptyTitle={`No ${LABELS[type].toLowerCase()} found`} emptyText="Create the first item or change the filters." /></section>
  </div>
}

function CoreFields({ value, setValue, isNew, onSynced }) {
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
    {value.type !== 'roadmap' && <>
      <label>Icon / glyph<input value={data.icon || ''} onChange={event => updateData('icon', event.target.value)} /></label>
      <label>Category tag<input value={data.tag || ''} onChange={event => updateData('tag', event.target.value)} /></label>
      <label>Project status<input placeholder="active, beta, dev, planned" value={data.status || ''} onChange={event => updateData('status', event.target.value)} /></label>
      <label>Version<input value={data.version || ''} onChange={event => updateData('version', event.target.value)} /></label>
      <label className="wide">Short description<textarea rows="3" value={data.shortDesc || ''} onChange={event => updateData('shortDesc', event.target.value)} /></label>
      <label className="wide">Full description<textarea rows="7" value={data.desc || ''} onChange={event => updateData('desc', event.target.value)} /></label>
    </>}
    {value.type === 'blog' && <>
      <label>Category<input value={data.category || ''} onChange={event => updateData('category', event.target.value)} /></label>
      <label>Publication date<input type="date" value={data.date || ''} onChange={event => updateData('date', event.target.value)} /></label>
      <label>Reading time<input placeholder="7 min" value={data.readTime || ''} onChange={event => updateData('readTime', event.target.value)} /></label>
      <label className="wide">Article excerpt<textarea rows="3" value={data.excerpt || ''} onChange={event => updateData('excerpt', event.target.value)} /></label>
      <label className="wide">Article body <small>Markdown supported</small><textarea rows="18" value={data.content || ''} onChange={event => updateData('content', event.target.value)} /></label>
    </>}
    {value.type === 'roadmap' && <>
      <label>Quarter / period<input value={data.quarter || ''} onChange={event => updateData('quarter', event.target.value)} /></label>
      <RoadmapEditor items={data.items || []} onChange={items => updateData('items', items)} isNew={isNew} onSynced={onSynced} />
    </>}
    {value.type === 'chronicle' && <>
      <label>Series<input value={data.series || ''} onChange={event => updateData('series', event.target.value)} /></label>
      <label>Book / volume<input value={data.book || ''} onChange={event => updateData('book', event.target.value)} /></label>
      <label>Genre<input list="chronicle-genres" value={data.genre || ''} onChange={event => updateData('genre', event.target.value)} /><datalist id="chronicle-genres"><option value="Dark Fantasy" /><option value="Science Fantasy" /><option value="Horror" /><option value="Mystery" /><option value="Speculative Fiction" /></datalist></label>
      <label>Character name<input value={data.characterName || ''} onChange={event => updateData('characterName', event.target.value)} /></label>
      <label>Narrative format<input value={data.engine || ''} onChange={event => updateData('engine', event.target.value)} /></label>
      <label>Release date<input placeholder="TBA or 2027" value={data.releaseDate || ''} onChange={event => updateData('releaseDate', event.target.value)} /></label>
    </>}
    {value.type !== 'roadmap' && <>
      <label>Platforms <small>one per line</small><textarea rows="6" value={(data.platforms || []).join('\n')} onChange={event => listField('platforms', event.target.value)} /></label>
      <label>Technology <small>one per line</small><textarea rows="6" value={(data.techStack || []).join('\n')} onChange={event => listField('techStack', event.target.value)} /></label>
      <label className="wide">Features <small>one per line</small><textarea rows="8" value={(data.features || []).join('\n')} onChange={event => listField('features', event.target.value)} /></label>
    </>}
    <div className="wide advanced-editor"><button type="button" className="admin-button" onClick={() => { setAdvanced(!advanced); setAdvancedText(JSON.stringify(data, null, 2)) }}>{advanced ? 'HIDE' : 'SHOW'} ADVANCED DATA</button>{advanced && <><p className="admin-muted">Full structured record for specialized fields, chapters, metadata, and future modules.</p><textarea rows="20" value={advancedText} onChange={event => setAdvancedText(event.target.value)} /><button type="button" className="admin-button" onClick={() => { try { setValue({ ...value, data: JSON.parse(advancedText) }) } catch { window.alert('Advanced data is not valid JSON.') } }}>APPLY VALID JSON</button></>}</div>
  </div>
}

function ContentEditor({ type, id, schema, onBack }) {
  const isNew = !id
  const initialItem = isNew ? { type, title: '', slug: '', status: 'draft', sortOrder: 0, data: initialData(type) } : null
  const [item, setItem] = useState(initialItem)
  const [savedSignature, setSavedSignature] = useState(editorSignature(initialItem))
  const [assets, setAssets] = useState([])
  const [releases, setReleases] = useState([])
  const [tab, setTab] = useState('content')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { if (!id) return; const result = await adminApi(`/content/${id}`); setItem(result.item); setSavedSignature(editorSignature(result.item)); setAssets(result.assets.map(asset => ({ ...asset, url: `/api/assets/${asset.id}` }))); setReleases(result.releases) }, [id])
  useEffect(() => {
    if (!id) return undefined
    let active = true
    adminApi(`/content/${id}`)
      .then(result => {
        if (!active) return
        setItem(result.item)
        setSavedSignature(editorSignature(result.item))
        setAssets(result.assets.map(asset => ({ ...asset, url: `/api/assets/${asset.id}` })))
        setReleases(result.releases)
      })
      .catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [id])
  const dirty = Boolean(item && editorSignature(item) !== savedSignature)
  useEffect(() => {
    const warn = event => { if (!dirty) return; event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  async function save(event) {
    event?.preventDefault(); setBusy(true); setMessage('Saving…')
    try {
      const payload = { type: item.type, title: item.title, slug: item.slug, status: item.status, sortOrder: item.sortOrder, data: item.data }
      const result = await adminApi(isNew ? '/content' : `/content/${id}`, { method: isNew ? 'POST' : 'PATCH', body: JSON.stringify(payload) })
      const syncCount = result.roadmapSync?.changes?.length || 0
      setMessage(isNew ? 'Created. Opening full editor…' : `Changes saved.${syncCount ? ` ${syncCount} roadmap milestone${syncCount === 1 ? '' : 's'} synchronized.` : ''}`)
      if (isNew) window.location.hash = `edit:${type}:${result.item.id}`
      else { setItem(result.item); setSavedSignature(editorSignature(result.item)) }
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function archive() {
    if (!window.confirm('Archive this item? It will disappear from the public website.')) return
    try { await adminApi(`/content/${id}`, { method: 'DELETE' }); onBack() } catch (error) { setMessage(error.message) }
  }
  if (!item) return <div className="admin-loading">LOADING RECORD…</div>
  return <div><header className="admin-page-header editor-header"><div><button className="back-button" onClick={() => { if (!dirty || window.confirm('Discard unsaved changes?')) onBack() }}>← {LABELS[type]}</button><h1>{isNew ? `New ${type}` : item.title}</h1><span className={`status-chip ${item.status}`}>{item.status}</span>{dirty && <span className="unsaved-chip">UNSAVED</span>}</div><div>{!isNew && <button className="admin-button danger" onClick={archive}>ARCHIVE</button>}<button className="admin-button primary" disabled={busy || !dirty} onClick={save}>{busy ? 'SAVING…' : dirty ? 'SAVE CHANGES' : 'SAVED'}</button></div></header>
    {!isNew && <div className="admin-tabs editor-tabs" role="tablist" aria-label="Content editor sections"><button role="tab" aria-selected={tab === 'content'} className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>CONTENT</button><button role="tab" aria-selected={tab === 'assets'} className={tab === 'assets' ? 'active' : ''} onClick={() => setTab('assets')}>VISUAL ASSETS <span>{assets.length}</span></button>{type === 'chronicle' && <button role="tab" aria-selected={tab === 'chapters'} className={tab === 'chapters' ? 'active' : ''} onClick={() => setTab('chapters')}>CHAPTERS</button>}<button role="tab" aria-selected={tab === 'releases'} className={tab === 'releases' ? 'active' : ''} onClick={() => setTab('releases')}>RELEASES <span>{releases.length}</span></button><button role="tab" aria-selected={tab === 'commerce'} className={tab === 'commerce' ? 'active' : ''} onClick={() => setTab('commerce')}>COMMERCE</button></div>}
    <section className="admin-panel editor-panel">{tab === 'content' && <form onSubmit={save}><CoreFields value={item} setValue={setItem} isNew={isNew} onSynced={load} /></form>}{tab === 'assets' && <AssetManager item={item} specs={schema.assetSpecs[type] || {}} assets={assets} onChanged={load} />}{tab === 'chapters' && <ChapterManager item={item} maxBytes={schema.maxChapterBytes} />}{tab === 'releases' && <ReleaseManager item={item} releases={releases} schema={schema} onChanged={load} />}{tab === 'commerce' && <CommerceManager item={item} schema={schema} releases={releases} />}</section>
    {message && <div className="admin-toast" role="status" aria-live="polite">{message}</div>}
  </div>
}

function parseView() {
  const value = window.location.hash.slice(1)
  if (value.startsWith('module:')) return { page: 'module', type: value.split(':')[1] }
  if (value.startsWith('new:')) return { page: 'new', type: value.split(':')[1] }
  if (value.startsWith('edit:')) { const [, type, id] = value.split(':'); return { page: 'edit', type, id } }
  if (value === 'users') return { page: 'users' }
  if (value === 'security') return { page: 'security' }
  if (value === 'ai') return { page: 'ai' }
  if (value === 'media') return { page: 'media' }
  if (value === 'settings') return { page: 'settings' }
  if (value === 'messages') return { page: 'messages' }
  if (value === 'comments') return { page: 'comments' }
  if (value === 'system') return { page: 'system' }
  if (value === 'layout') return { page: 'layout' }
  if (value === 'developer') return { page: 'developer' }
  if (value === 'store') return { page: 'store' }
  return { page: 'dashboard' }
}

export default function AdminApp() {
  const [user, setUser] = useState(undefined)
  const [schema, setSchema] = useState(null)
  const [view, setView] = useState(parseView)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sc-admin-sidebar') === 'collapsed')
  const [theme, setTheme] = useState(() => localStorage.getItem('sc-admin-theme') || 'dark')
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem('sc-admin-onboarding-v1') !== 'done')
  useEffect(() => { adminApi('/auth/session').then(result => setUser(result.user)).catch(() => setUser(null)) }, [])
  useEffect(() => { if (user && !user.mustChangePassword) adminApi('/schema').then(setSchema).catch(() => setUser(null)) }, [user])
  useEffect(() => { const change = () => setView(parseView()); window.addEventListener('hashchange', change); return () => window.removeEventListener('hashchange', change) }, [])
  const navigate = useCallback(value => { window.location.hash = value }, [])
  const can = useCallback(permission => user?.permissions?.includes('*') || user?.permissions?.includes(permission), [user])
  const title = useMemo(() => view.page === 'users' ? 'Administrators' : view.page === 'security' ? 'Security' : view.page === 'ai' ? 'AI assistant' : view.page === 'media' ? 'Media library' : view.page === 'settings' ? 'Settings & SEO' : view.page === 'messages' ? 'Messages & forms' : view.page === 'comments' ? 'Comments & moderation' : view.page === 'system' ? 'System & analytics' : view.page === 'layout' ? 'Navigation & layout' : view.page === 'developer' ? 'API & integrations' : view.page === 'store' ? 'Store & orders' : view.type ? LABELS[view.type] : 'Dashboard', [view.page, view.type])
  useEffect(() => { document.title = `${title} — Softcurse Control` }, [title])
  useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots) }
    robots.content = 'noindex, nofollow'
  }, [])
  useEffect(() => { document.documentElement.dataset.adminTheme = theme; localStorage.setItem('sc-admin-theme', theme) }, [theme])
  useEffect(() => {
    const openPalette = event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(true) } }
    window.addEventListener('keydown', openPalette)
    return () => window.removeEventListener('keydown', openPalette)
  }, [])
  async function logout() { await adminApi('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null) }
  if (user === undefined) return <div className="admin-loading full">INITIALIZING CONTROL SYSTEM…</div>
  if (!user) return <Login onLogin={setUser} />
  if (user.mustChangePassword) return <main className="admin-login"><PasswordChange required onChanged={() => adminApi('/auth/session').then(result => setUser(result.user))} /></main>
  if (!schema) return <div className="admin-loading full">LOADING CMS SCHEMA…</div>
  const commands = [
    { id: 'dashboard', label: 'Open dashboard', group: 'Navigation', icon: '⌂', run: () => navigate('') },
    ...Object.entries(LABELS).map(([type, label]) => ({ id: `module-${type}`, label: `Open ${label}`, group: 'Content', icon: '◇', run: () => navigate(`module:${type}`) })),
    ...(can('content.create') ? [{ id: 'new-blog', label: 'Create blog article', group: 'Quick action', icon: '＋', run: () => navigate('new:blog') }] : []),
    ...(can('users.view') ? [{ id: 'users', label: 'Manage administrators', group: 'Access control', icon: '♙', run: () => navigate('users') }] : []),
    ...(can('security.view') ? [{ id: 'security', label: 'Open security center', group: 'Access control', icon: '⌾', run: () => navigate('security') }] : []),
    ...(can('ai.use') ? [{ id: 'ai', label: 'Open AI assistant', group: 'Tools', icon: '✦', run: () => navigate('ai') }] : []),
    ...(can('media.view') ? [{ id: 'media', label: 'Open media library', group: 'Tools', icon: '▣', run: () => navigate('media') }] : []),
    ...(can('messages.view') ? [{ id: 'messages', label: 'Open messages and forms', group: 'Tools', icon: '✉', run: () => navigate('messages') }] : []),
    ...(can('comments.view') ? [{ id: 'comments', label: 'Open comments and moderation', group: 'Community', icon: '◌', run: () => navigate('comments') }] : []),
    ...(can('analytics.view') || can('security.view') ? [{ id: 'system', label: 'Open system and analytics', group: 'Tools', icon: '▤', run: () => navigate('system') }] : []),
    ...(can('layout.view') ? [{ id: 'layout', label: 'Open navigation and layout', group: 'Tools', icon: '☷', run: () => navigate('layout') }] : []),
    ...(can('developer.view') ? [{ id: 'developer', label: 'Open API and integrations', group: 'Tools', icon: '⌘', run: () => navigate('developer') }] : []),
    ...(can('orders.view') ? [{ id: 'store', label: 'Open store and orders', group: 'Commerce', icon: '¤', run: () => navigate('store') }] : []),
    ...(can('settings.view') ? [{ id: 'settings', label: 'Open settings and SEO', group: 'Tools', icon: '⚙', run: () => navigate('settings') }] : []),
    { id: 'site', label: 'View public website', group: 'Navigation', icon: '↗', run: () => { window.location.href = '/' } },
  ]
  function toggleSidebar() { setSidebarCollapsed(value => { localStorage.setItem('sc-admin-sidebar', value ? 'expanded' : 'collapsed'); return !value }) }
  return <div className={`admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <a className="admin-skip-link" href="#admin-main-start">Skip to content</a>
    <aside className="admin-sidebar"><button className="sidebar-collapse" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={toggleSidebar}>{sidebarCollapsed ? '›' : '‹'}</button><a className="admin-logo" href="#" onClick={() => navigate('')}><b>SOFTCURSE</b><span>CONTROL // v2.0</span></a><nav><button className={view.page === 'dashboard' ? 'active' : ''} onClick={() => navigate('')}>⌂ <span>Dashboard</span></button><p>CONTENT</p>{Object.entries(LABELS).map(([type, label]) => <button key={type} className={view.type === type ? 'active' : ''} onClick={() => navigate(`module:${type}`)}>◇ <span>{label}</span></button>)}<p>MANAGEMENT</p>{can('messages.view') && <button className={view.page === 'messages' ? 'active' : ''} onClick={() => navigate('messages')}>✉ <span>Messages & forms</span></button>}{can('comments.view') && <button className={view.page === 'comments' ? 'active' : ''} onClick={() => navigate('comments')}>◌ <span>Comments</span></button>}{can('orders.view') && <button className={view.page === 'store' ? 'active' : ''} onClick={() => navigate('store')}>¤ <span>Store & orders</span></button>}{can('media.view') && <button className={view.page === 'media' ? 'active' : ''} onClick={() => navigate('media')}>▣ <span>Media library</span></button>}{can('layout.view') && <button className={view.page === 'layout' ? 'active' : ''} onClick={() => navigate('layout')}>☷ <span>Navigation & layout</span></button>}{(can('analytics.view') || can('security.view')) && <button className={view.page === 'system' ? 'active' : ''} onClick={() => navigate('system')}>▤ <span>System & analytics</span></button>}{can('settings.view') && <button className={view.page === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}>⚙ <span>Settings & SEO</span></button>}{can('developer.view') && <button className={view.page === 'developer' ? 'active' : ''} onClick={() => navigate('developer')}>⌘ <span>API & integrations</span></button>}{can('users.view') && <button className={view.page === 'users' ? 'active' : ''} onClick={() => navigate('users')}>♙ <span>Administrators</span></button>}{can('security.view') && <button className={view.page === 'security' ? 'active' : ''} onClick={() => navigate('security')}>⌾ <span>Security</span></button>}{can('ai.use') && <button className={view.page === 'ai' ? 'active' : ''} onClick={() => navigate('ai')}>✦ <span>AI assistant</span></button>}</nav><div className="admin-operator"><span>● ONLINE</span><strong>{user.displayName || user.username}</strong><small>{user.roles?.map(role => role.name).join(', ') || 'Administrator'}</small><button onClick={logout}>SIGN OUT</button></div></aside>
    <div className="admin-workspace"><header className="admin-topbar"><div><button className="mobile-menu" onClick={toggleSidebar}>☰</button><span>Control panel</span><b>/</b><strong>{title}</strong></div><div><button className="command-trigger" onClick={() => setPaletteOpen(true)}>⌕ <span>Search commands</span><kbd>Ctrl K</kbd></button><NotificationCenter navigate={navigate} /><button className="theme-button" aria-label="Toggle color theme" onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☼' : '☾'}</button><a className="view-site" href="/">VIEW SITE ↗</a></div></header>
      <main id="admin-main-start" className="admin-main" tabIndex="-1">{view.page === 'dashboard' && <Dashboard user={user} onSelect={(type, create) => navigate(create ? `new:${type}` : `module:${type}`)} />}{view.page === 'module' && <ContentList type={view.type} onCreate={() => navigate(`new:${view.type}`)} onEdit={id => navigate(`edit:${view.type}:${id}`)} />}{(view.page === 'new' || view.page === 'edit') && <ContentEditor type={view.type} id={view.id} schema={schema} onBack={() => navigate(`module:${view.type}`)} />}{view.page === 'messages' && <MessageInbox canManage={can('messages.manage')} />}{view.page === 'comments' && <CommentManager canManage={can('comments.manage')} />}{view.page === 'layout' && <LayoutManager canManage={can('layout.manage')} />}{view.page === 'developer' && <DeveloperTools canManage={can('developer.manage')} />}{view.page === 'store' && <StoreManager canManage={can('orders.manage')} />}{view.page === 'system' && <SystemManager canManage={can('system.manage')} canAnalytics={can('analytics.view')} />}{view.page === 'media' && <MediaLibrary canManage={can('media.manage')} navigate={navigate} />}{view.page === 'settings' && <SettingsManager canManage={can('settings.manage')} />}{view.page === 'users' && <UserManager />}{view.page === 'security' && <SecurityManager />}{view.page === 'ai' && <AiAssistant />}</main>
    </div>
    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    {showOnboarding && <OnboardingTour onDone={() => { localStorage.setItem('sc-admin-onboarding-v1', 'done'); setShowOnboarding(false) }} />}
  </div>
}

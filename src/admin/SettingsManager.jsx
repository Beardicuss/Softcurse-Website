import { useCallback, useEffect, useState } from 'react'
import { adminApi } from './api'

const EMPTY = {
  site: { name: '', tagline: '', description: '', contactEmail: '', themeColor: '#4ffff0', logoUrl: '', faviconUrl: '', socials: { github: '', youtube: '', discord: '', x: '' } },
  seo: { titleTemplate: '%s — Softcurse Systems', defaultTitle: '', defaultDescription: '', defaultOgImage: '', robotsIndex: true, sitemapEnabled: true, excludedPaths: [] },
  maintenance: { enabled: false, title: 'Maintenance in progress', message: '', allowAdmins: true },
}

export default function SettingsManager({ canManage }) {
  const [settings, setSettings] = useState(EMPTY)
  const [redirects, setRedirects] = useState([])
  const [revisions, setRevisions] = useState([])
  const [tab, setTab] = useState('site')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [draftRedirect, setDraftRedirect] = useState({ sourcePath: '', destination: '', statusCode: 301 })
  const load = useCallback(async () => {
    const [config, redirectData] = await Promise.all([adminApi('/settings'), adminApi('/redirects')])
    setSettings({ ...EMPTY, ...config.settings, site: { ...EMPTY.site, ...config.settings.site, socials: { ...EMPTY.site.socials, ...config.settings.site?.socials } }, seo: { ...EMPTY.seo, ...config.settings.seo }, maintenance: { ...EMPTY.maintenance, ...config.settings.maintenance } })
    setRedirects(redirectData.redirects); setRevisions(config.revisions)
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => load().catch(error => setMessage(error.message)), 0)
    return () => clearTimeout(timer)
  }, [load])
  const update = (group, key, value) => setSettings(current => ({ ...current, [group]: { ...current[group], [key]: value } }))

  async function save(group) {
    setBusy(true); setMessage('Saving settings…')
    try { const result = await adminApi('/settings', { method: 'PATCH', body: JSON.stringify({ key: group, value: settings[group] }) }); setSettings(current => ({ ...current, [group]: result.value })); setMessage('Settings saved and active.'); await load() } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function addRedirect(event) {
    event.preventDefault()
    try { await adminApi('/redirects', { method: 'POST', body: JSON.stringify(draftRedirect) }); setDraftRedirect({ sourcePath: '', destination: '', statusCode: 301 }); setMessage('Redirect created.'); await load() } catch (error) { setMessage(error.message) }
  }
  async function toggleRedirect(item) {
    try { await adminApi(`/redirects/${item.id}`, { method: 'PATCH', body: JSON.stringify({ statusCode: item.status_code, isActive: !item.is_active }) }); await load() } catch (error) { setMessage(error.message) }
  }
  async function deleteRedirect(item) {
    if (!window.confirm(`Delete redirect ${item.source_path}?`)) return
    try { await adminApi(`/redirects/${item.id}`, { method: 'DELETE' }); await load() } catch (error) { setMessage(error.message) }
  }

  return <div><header className="admin-page-header"><div><p className="eyebrow">SITE CONFIGURATION</p><h1>Settings & SEO</h1><p className="admin-muted">Control site identity, search visibility, redirects, and availability.</p></div></header>
    <div className="admin-tabs settings-tabs" role="tablist">{['site', 'seo', 'redirects', 'maintenance', 'history'].map(value => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value.toUpperCase()}</button>)}</div>
    {message && <p className="admin-message" role="status">{message}</p>}
    {tab === 'site' && <section className="admin-panel"><div className="panel-heading"><div><h2>Site identity</h2><span>Used by public metadata and future navigation controls</span></div></div><div className="settings-grid"><label>Site name<input value={settings.site.name} onChange={event => update('site', 'name', event.target.value)} /></label><label>Contact email<input type="email" value={settings.site.contactEmail} onChange={event => update('site', 'contactEmail', event.target.value)} /></label><label className="wide">Tagline<input value={settings.site.tagline} onChange={event => update('site', 'tagline', event.target.value)} /></label><label className="wide">Site description<textarea rows="4" value={settings.site.description} onChange={event => update('site', 'description', event.target.value)} /></label><label>Theme color<input type="color" value={settings.site.themeColor} onChange={event => update('site', 'themeColor', event.target.value)} /></label><label>Logo URL<input value={settings.site.logoUrl} onChange={event => update('site', 'logoUrl', event.target.value)} /></label><label>Favicon URL<input value={settings.site.faviconUrl} onChange={event => update('site', 'faviconUrl', event.target.value)} /></label>{Object.keys(settings.site.socials).map(name => <label key={name}>{name}<input value={settings.site.socials[name]} onChange={event => update('site', 'socials', { ...settings.site.socials, [name]: event.target.value })} /></label>)}</div>{canManage && <button className="admin-button primary settings-save" disabled={busy} onClick={() => save('site')}>SAVE SITE SETTINGS</button>}</section>}
    {tab === 'seo' && <section className="admin-panel"><div className="panel-heading"><div><h2>Search defaults</h2><span>Fallback metadata and crawler controls</span></div><div className={`status-chip ${settings.seo.robotsIndex ? 'published' : 'archived'}`}>{settings.seo.robotsIndex ? 'INDEXABLE' : 'NOINDEX'}</div></div><div className="settings-grid"><label>Default title<input value={settings.seo.defaultTitle} onChange={event => update('seo', 'defaultTitle', event.target.value)} /></label><label>Title template<input value={settings.seo.titleTemplate} onChange={event => update('seo', 'titleTemplate', event.target.value)} /></label><label className="wide">Default description<textarea rows="4" value={settings.seo.defaultDescription} onChange={event => update('seo', 'defaultDescription', event.target.value)} /></label><label className="wide">Default OG image<input value={settings.seo.defaultOgImage} onChange={event => update('seo', 'defaultOgImage', event.target.value)} /></label><label className="toggle-setting"><input type="checkbox" checked={settings.seo.robotsIndex} onChange={event => update('seo', 'robotsIndex', event.target.checked)} /><span>Allow search indexing</span></label><label className="toggle-setting"><input type="checkbox" checked={settings.seo.sitemapEnabled} onChange={event => update('seo', 'sitemapEnabled', event.target.checked)} /><span>Publish sitemap</span></label><label className="wide">Excluded paths <small>one path per line</small><textarea rows="7" value={settings.seo.excludedPaths.join('\n')} onChange={event => update('seo', 'excludedPaths', event.target.value.split('\n').map(value => value.trim()).filter(Boolean))} /></label></div>{canManage && <button className="admin-button primary settings-save" disabled={busy} onClick={() => save('seo')}>SAVE SEO SETTINGS</button>}</section>}
    {tab === 'redirects' && <section className="admin-panel"><div className="panel-heading"><div><h2>Redirect manager</h2><span>Exact-path 301 and 302 redirects</span></div></div>{canManage && <form className="redirect-form" onSubmit={addRedirect}><label>From path<input required placeholder="/old-page" value={draftRedirect.sourcePath} onChange={event => setDraftRedirect({ ...draftRedirect, sourcePath: event.target.value })} /></label><label>Destination<input required placeholder="/new-page or https://…" value={draftRedirect.destination} onChange={event => setDraftRedirect({ ...draftRedirect, destination: event.target.value })} /></label><label>Type<select value={draftRedirect.statusCode} onChange={event => setDraftRedirect({ ...draftRedirect, statusCode: Number(event.target.value) })}><option value="301">301 permanent</option><option value="302">302 temporary</option></select></label><button className="admin-button primary">ADD REDIRECT</button></form>}<div className="redirect-list">{redirects.map(item => <article key={item.id} className={!item.is_active ? 'disabled' : ''}><code>{item.source_path}</code><span>→</span><strong>{item.destination}</strong><small>{item.status_code} · {item.hit_count} hits</small>{canManage && <div><button className="admin-button compact" onClick={() => toggleRedirect(item)}>{item.is_active ? 'DISABLE' : 'ENABLE'}</button><button className="admin-button compact danger" onClick={() => deleteRedirect(item)}>DELETE</button></div>}</article>)}{!redirects.length && <p className="admin-muted">No redirects configured.</p>}</div></section>}
    {tab === 'maintenance' && <section className="admin-panel"><div className="panel-heading"><div><h2>Maintenance mode</h2><span>Administrators can remain allowed while visitors see a 503 page</span></div><div className={`status-chip ${settings.maintenance.enabled ? 'archived' : 'published'}`}>{settings.maintenance.enabled ? 'ACTIVE' : 'OFF'}</div></div><div className="settings-grid"><label className="toggle-setting wide"><input type="checkbox" checked={settings.maintenance.enabled} onChange={event => update('maintenance', 'enabled', event.target.checked)} /><span>Enable maintenance mode</span></label><label className="wide">Page title<input value={settings.maintenance.title} onChange={event => update('maintenance', 'title', event.target.value)} /></label><label className="wide">Visitor message<textarea rows="5" value={settings.maintenance.message} onChange={event => update('maintenance', 'message', event.target.value)} /></label><label className="toggle-setting wide"><input type="checkbox" checked={settings.maintenance.allowAdmins} onChange={event => update('maintenance', 'allowAdmins', event.target.checked)} /><span>Allow signed-in administrators to view the public site</span></label></div>{canManage && <button className="admin-button primary settings-save" disabled={busy} onClick={() => save('maintenance')}>SAVE MAINTENANCE SETTINGS</button>}</section>}
    {tab === 'history' && <section className="admin-panel"><div className="panel-heading"><div><h2>Settings history</h2><span>Latest saved revisions</span></div></div><div className="settings-history">{revisions.map(item => <article key={item.id}><strong>{item.setting_key}</strong><span>{item.changed_by}</span><time>{new Date(`${item.created_at}Z`).toLocaleString()}</time></article>)}{!revisions.length && <p className="admin-muted">No settings changes yet.</p>}</div></section>}
  </div>
}

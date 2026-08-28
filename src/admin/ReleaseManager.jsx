import { useEffect, useRef, useState } from 'react'
import { adminApi, formatBytes } from './api'

const emptyWeb = { label: 'Play online', externalUrl: '', version: '', platform: 'web', channel: 'stable', status: 'draft', isPrimary: true, releaseNotes: '' }
const emptyExternal = { label: 'Download', externalUrl: '', provider: 'github', actionRole: 'download', version: '', channel: 'stable', platform: 'windows', architecture: 'x64', fileName: '', sizeMb: '', sha256: '', status: 'draft', isPrimary: true, releaseNotes: '' }
const emptyFile = { label: 'Download', version: '', channel: 'stable', platform: 'windows', architecture: 'x64', status: 'draft', isPrimary: true, sha256: '', releaseNotes: '' }

const providerNames = { softcurse: 'Softcurse storage', github: 'GitHub Releases', mega: 'MEGA', itchio: 'itch.io', google_drive: 'Google Drive', onedrive: 'OneDrive', dropbox: 'Dropbox', custom: 'Custom HTTPS URL' }
const roleNames = { play: 'Play / launch', download: 'Download', store: 'Store page', source: 'Source code' }

function loadDraft(contentId) {
  try {
    return JSON.parse(localStorage.getItem(`softcurse:release-draft:${contentId}`) || '{}')
  } catch {
    return {}
  }
}

export default function ReleaseManager({ item, releases, schema, onChanged }) {
  const restored = loadDraft(item.id)
  const [mode, setMode] = useState('web')
  const [web, setWeb] = useState(() => ({ ...emptyWeb, ...restored.web }))
  const [external, setExternal] = useState(() => ({ ...emptyExternal, ...restored.external }))
  const [fileMeta, setFileMeta] = useState(() => ({ ...emptyFile, ...restored.fileMeta }))
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(`softcurse:release-draft:${item.id}`, JSON.stringify({ web, external, fileMeta }))
  }, [external, fileMeta, item.id, web])

  function field(state, setter, key) {
    const onChange = event => setter({ ...state, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
    return typeof state[key] === 'boolean' ? { checked: state[key], onChange } : { value: state[key], onChange }
  }

  async function addExternal(event, kind) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      const state = kind === 'web' ? web : external
      const payload = { ...state, contentId: item.id, kind }
      if (kind === 'external') payload.sizeBytes = state.sizeMb ? Math.round(Number(state.sizeMb) * 1024 * 1024) : null
      await adminApi('/releases', { method: 'POST', body: JSON.stringify(payload) })
      if (kind === 'web') setWeb(emptyWeb); else setExternal(emptyExternal)
      const visibility = state.status === 'draft' ? ' as a draft' : ' and published'
      setMessage(kind === 'web' ? `Web launcher saved${visibility}.` : `External release saved${visibility}.`); await onChanged()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function uploadFile(event) {
    event.preventDefault()
    if (!file) return setMessage('Choose an installer or download file.')
    setBusy(true); setProgress(0); setMessage('Creating secure multipart upload…')
    let uploadId
    try {
      const created = await adminApi('/uploads', { method: 'POST', body: JSON.stringify({ ...fileMeta, contentId: item.id, fileName: file.name, sizeBytes: file.size, mimeType: file.type || 'application/octet-stream' }) })
      uploadId = created.uploadId
      const parts = []
      const count = Math.ceil(file.size / created.partSize)
      for (let index = 0; index < count; index += 1) {
        const start = index * created.partSize
        const chunk = file.slice(start, Math.min(file.size, start + created.partSize))
        setMessage(`Uploading part ${index + 1} of ${count}…`)
        const uploaded = await adminApi(`/uploads/${uploadId}?part=${index + 1}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: chunk })
        parts.push({ partNumber: uploaded.partNumber, etag: uploaded.etag })
        setProgress(Math.round(((index + 1) / count) * 100))
      }
      setMessage('Finalizing release…')
      await adminApi(`/uploads/${uploadId}`, { method: 'POST', body: JSON.stringify({ parts }) })
      setFile(null); setFileMeta(emptyFile); if (fileRef.current) fileRef.current.value = ''
      setMessage('Installer/download published to Softcurse storage.'); await onChanged()
    } catch (error) {
      setMessage(error.message)
      if (uploadId) adminApi(`/uploads/${uploadId}`, { method: 'DELETE' }).catch(() => {})
    } finally { setBusy(false) }
  }

  async function update(release, changes) {
    try { await adminApi(`/releases/${release.id}`, { method: 'PATCH', body: JSON.stringify(changes) }); await onChanged() } catch (error) { setMessage(error.message) }
  }
  async function remove(release) {
    if (!window.confirm(`Delete release “${release.label}”?${release.kind === 'file' ? ' The uploaded file will also be removed.' : ''}`)) return
    try { await adminApi(`/releases/${release.id}`, { method: 'DELETE' }); await onChanged() } catch (error) { setMessage(error.message) }
  }

  const commonFields = (state, setter) => <>
    <label>Version<input placeholder="1.0.0" {...field(state, setter, 'version')} /></label>
    <label>Release channel<select {...field(state, setter, 'channel')}>{schema.releaseChannels.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    <label>Publish state<select {...field(state, setter, 'status')}><option value="draft">Draft</option><option value="published">Published</option></select></label>
    <label className="check"><input type="checkbox" {...field(state, setter, 'isPrimary')} /> Primary action for this category</label>
    <label className="wide">Release notes<textarea rows="5" {...field(state, setter, 'releaseNotes')} /></label>
  </>

  return <div className="release-manager">
    <div className="release-list">
      {releases.length === 0 && <p className="admin-muted">No launcher or downloadable release yet.</p>}
      {releases.map(release => <article className="release-row" key={release.id}>
        <div><strong>{release.action_role === 'play' ? '↗' : release.action_role === 'store' ? '¤' : '↓'} {release.label}</strong><span>{providerNames[release.provider] || release.provider} · {roleNames[release.action_role] || release.action_role} · {release.channel || 'stable'}</span><span>{release.platform}{release.architecture ? ` · ${release.architecture}` : ''}{release.version ? ` · v${release.version}` : ''}</span>{release.size_bytes && <small>{release.file_name || 'External file'} · {formatBytes(release.size_bytes)} · {release.download_count} tracked downloads</small>}</div>
        <div className="release-actions">
          <button type="button" aria-pressed={release.status === 'published'} aria-label={`${release.label}: ${release.status}. Toggle publish state`} className={`status-chip ${release.status}`} onClick={() => update(release, { status: release.status === 'published' ? 'draft' : 'published' })}>{release.status}</button>
          <button type="button" aria-pressed={Boolean(release.is_primary)} className={release.is_primary ? 'primary-chip active' : 'primary-chip'} onClick={() => update(release, { isPrimary: true })}>PRIMARY</button>
          <button type="button" className="icon-button danger" aria-label={`Delete ${release.label}`} onClick={() => remove(release)}>×</button>
        </div>
      </article>)}
    </div>

    <div className="release-guidance"><strong>Choose where the real file lives</strong><span>External providers use no Softcurse R2 storage. Managed uploads use your Cloudflare storage allowance.</span></div>
    <div className="admin-tabs" role="tablist" aria-label="Release type">
      <button type="button" role="tab" aria-selected={mode === 'web'} className={mode === 'web' ? 'active' : ''} onClick={() => setMode('web')}>WEB LAUNCHER</button>
      <button type="button" role="tab" aria-selected={mode === 'external'} className={mode === 'external' ? 'active' : ''} onClick={() => setMode('external')}>EXTERNAL / MIRROR</button>
      <button type="button" role="tab" aria-selected={mode === 'file'} className={mode === 'file' ? 'active' : ''} onClick={() => setMode('file')}>R2 MANAGED FILE</button>
    </div>

    {mode === 'web' && <form className="admin-form-grid" onSubmit={event => addExternal(event, 'web')}>
      <label>Button label <small>choose a suggestion or type your own</small><input required list="web-label-suggestions" {...field(web, setWeb, 'label')} /><datalist id="web-label-suggestions"><option value="Play online" /><option value="Launch" /><option value="Open web app" /><option value="Try demo" /><option value="Visit project" /></datalist></label>
      <label>Hosted URL<input required type="url" placeholder="https://game.pages.dev/" {...field(web, setWeb, 'externalUrl')} /></label>
      {commonFields(web, setWeb)}
      <button className="admin-button primary" disabled={busy}>{web.status === 'draft' ? 'SAVE LAUNCHER DRAFT' : 'PUBLISH WEB LAUNCHER'}</button>
    </form>}

    {mode === 'external' && <form className="admin-form-grid" onSubmit={event => addExternal(event, 'external')}>
      <label>Provider<select {...field(external, setExternal, 'provider')}>{schema.releaseProviders.filter(value => value !== 'softcurse').map(value => <option key={value} value={value}>{providerNames[value]}</option>)}</select></label>
      <label>Action<select {...field(external, setExternal, 'actionRole')}>{schema.releaseRoles.filter(value => value !== 'play').map(value => <option key={value} value={value}>{roleNames[value]}</option>)}</select></label>
      <label>Button label <small>choose a suggestion or type your own</small><input required list="external-label-suggestions" {...field(external, setExternal, 'label')} /><datalist id="external-label-suggestions"><option value="Download" /><option value="Get on GitHub" /><option value="Get on itch.io" /><option value="Visit store" /><option value="View source" /><option value="Download mirror" /></datalist></label>
      <label>HTTPS link<input required type="url" placeholder="https://github.com/owner/project/releases/latest/download/setup.exe" {...field(external, setExternal, 'externalUrl')} /></label>
      <label>Platform<select {...field(external, setExternal, 'platform')}>{schema.platforms.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Architecture<select {...field(external, setExternal, 'architecture')}>{schema.architectures.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>File name<input placeholder="Softcurse-App-Setup.exe" {...field(external, setExternal, 'fileName')} /></label>
      <label>Approximate size (MB)<input type="number" min="0" step="0.01" {...field(external, setExternal, 'sizeMb')} /></label>
      <label className="wide">SHA-256 checksum<input inputMode="text" maxLength="64" pattern="[A-Fa-f0-9]{64}" placeholder="64 hexadecimal characters" {...field(external, setExternal, 'sha256')} /></label>
      {commonFields(external, setExternal)}
      <button className="admin-button primary" disabled={busy}>{external.status === 'draft' ? 'SAVE RELEASE DRAFT' : 'PUBLISH EXTERNAL RELEASE'}</button>
    </form>}

    {mode === 'file' && <form className="admin-form-grid" onSubmit={uploadFile}>
      <label className="wide admin-file">Installer or downloadable file<input ref={fileRef} required type="file" accept=".exe,.msi,.zip,.7z,.rar,.apk,.dmg,.pkg,.AppImage,.deb,.rpm,.pdf,.epub" onChange={event => setFile(event.target.files?.[0] || null)} />{file && <span>{file.name} · {formatBytes(file.size)}</span>}</label>
      <label>Button label <small>choose a suggestion or type your own</small><input required list="file-label-suggestions" {...field(fileMeta, setFileMeta, 'label')} /><datalist id="file-label-suggestions"><option value="Download" /><option value="Download for Windows" /><option value="Get installer" /><option value="Download latest" /><option value="Download portable version" /></datalist></label>
      <label>Platform<select {...field(fileMeta, setFileMeta, 'platform')}>{schema.platforms.filter(value => value !== 'web').map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Architecture<select {...field(fileMeta, setFileMeta, 'architecture')}>{schema.architectures.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="wide">SHA-256 checksum <small>optional but recommended</small><input maxLength="64" pattern="[A-Fa-f0-9]{64}" {...field(fileMeta, setFileMeta, 'sha256')} /></label>
      {commonFields(fileMeta, setFileMeta)}
      {busy && <div className="upload-progress wide"><span style={{ width: `${progress}%` }} /></div>}
      <button className="admin-button primary" disabled={busy}>{busy ? `${progress}% UPLOADED` : 'UPLOAD TO R2'}</button>
    </form>}
    {message && <p className="admin-message" role="status" aria-live="polite">{message}</p>}
  </div>
}

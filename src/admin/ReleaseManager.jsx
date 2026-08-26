import { useRef, useState } from 'react'
import { adminApi, formatBytes } from './api'

const emptyWeb = { label: 'Play online', externalUrl: '', version: '', platform: 'web', status: 'draft', isPrimary: true, releaseNotes: '' }
const emptyFile = { label: 'Download', version: '', platform: 'windows', architecture: 'x64', status: 'draft', isPrimary: false, releaseNotes: '' }

export default function ReleaseManager({ item, releases, schema, onChanged }) {
  const [mode, setMode] = useState('web')
  const [web, setWeb] = useState(emptyWeb)
  const [fileMeta, setFileMeta] = useState(emptyFile)
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  function field(state, setter, key) {
    const onChange = event => setter({ ...state, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
    return typeof state[key] === 'boolean' ? { checked: state[key], onChange } : { value: state[key], onChange }
  }

  async function addWeb(event) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      await adminApi('/releases', { method: 'POST', body: JSON.stringify({ ...web, contentId: item.id, kind: 'web' }) })
      setWeb(emptyWeb); setMessage('Web launcher saved.'); await onChanged()
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
      setMessage('Installer/download published to storage.'); await onChanged()
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

  return <div className="release-manager">
    <div className="release-list">
      {releases.length === 0 && <p className="admin-muted">No launcher or downloadable release yet.</p>}
      {releases.map(release => <article className="release-row" key={release.id}>
        <div><strong>{release.kind === 'web' ? '↗' : '↓'} {release.label}</strong><span>{release.platform}{release.architecture ? ` · ${release.architecture}` : ''}{release.version ? ` · v${release.version}` : ''}</span>{release.kind === 'file' && <small>{release.file_name} · {formatBytes(release.size_bytes)} · {release.download_count} downloads</small>}</div>
        <div className="release-actions">
          <button type="button" aria-pressed={release.status === 'published'} aria-label={`${release.label}: ${release.status}. Toggle publish state`} className={`status-chip ${release.status}`} onClick={() => update(release, { status: release.status === 'published' ? 'draft' : 'published' })}>{release.status}</button>
          <button type="button" aria-pressed={Boolean(release.is_primary)} className={release.is_primary ? 'primary-chip active' : 'primary-chip'} onClick={() => update(release, { isPrimary: true })}>PRIMARY</button>
          <button type="button" className="icon-button danger" aria-label={`Delete ${release.label}`} onClick={() => remove(release)}>×</button>
        </div>
      </article>)}
    </div>
    <div className="admin-tabs" role="tablist" aria-label="Release type"><button type="button" role="tab" aria-selected={mode === 'web'} className={mode === 'web' ? 'active' : ''} onClick={() => setMode('web')}>WEB LAUNCHER</button><button type="button" role="tab" aria-selected={mode === 'file'} className={mode === 'file' ? 'active' : ''} onClick={() => setMode('file')}>INSTALLER / FILE</button></div>
    {mode === 'web' ? <form className="admin-form-grid" onSubmit={addWeb}>
      <label>Button label<input required {...field(web, setWeb, 'label')} /></label>
      <label>Hosted URL<input required type="url" placeholder="https://game.pages.dev/" {...field(web, setWeb, 'externalUrl')} /></label>
      <label>Version<input placeholder="1.0.0" {...field(web, setWeb, 'version')} /></label>
      <label>Publish state<select {...field(web, setWeb, 'status')}><option value="draft">Draft</option><option value="published">Published</option></select></label>
      <label className="check"><input type="checkbox" {...field(web, setWeb, 'isPrimary')} /> Primary action</label>
      <label className="wide">Release notes<textarea {...field(web, setWeb, 'releaseNotes')} /></label>
      <button className="admin-button primary" disabled={busy}>ADD WEB LAUNCHER</button>
    </form> : <form className="admin-form-grid" onSubmit={uploadFile}>
      <label className="wide admin-file">Installer or downloadable file<input ref={fileRef} required type="file" accept=".exe,.msi,.zip,.7z,.rar,.apk,.dmg,.pkg,.AppImage,.deb,.rpm,.pdf,.epub" onChange={event => setFile(event.target.files?.[0] || null)} />{file && <span>{file.name} · {formatBytes(file.size)}</span>}</label>
      <label>Button label<input required {...field(fileMeta, setFileMeta, 'label')} /></label>
      <label>Version<input placeholder="1.0.0" {...field(fileMeta, setFileMeta, 'version')} /></label>
      <label>Platform<select {...field(fileMeta, setFileMeta, 'platform')}>{schema.platforms.filter(p => p !== 'web').map(p => <option key={p}>{p}</option>)}</select></label>
      <label>Architecture<select {...field(fileMeta, setFileMeta, 'architecture')}>{schema.architectures.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Publish state<select {...field(fileMeta, setFileMeta, 'status')}><option value="draft">Draft</option><option value="published">Published</option></select></label>
      <label className="check"><input type="checkbox" {...field(fileMeta, setFileMeta, 'isPrimary')} /> Primary action</label>
      <label className="wide">Release notes<textarea {...field(fileMeta, setFileMeta, 'releaseNotes')} /></label>
      {busy && <div className="upload-progress wide"><span style={{ width: `${progress}%` }} /></div>}
      <button className="admin-button primary" disabled={busy}>{busy ? `${progress}% UPLOADED` : 'UPLOAD INSTALLER / FILE'}</button>
    </form>}
    {message && <p className="admin-message" role="status" aria-live="polite">{message}</p>}
  </div>
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { adminApi, formatBytes } from './api'

function draftFrom(chapter) {
  return { number: chapter.num, title: chapter.title, pov: chapter.pov || '', status: chapter.status }
}

export default function ChapterManager({ item, maxBytes = 2 * 1024 * 1024 }) {
  const [chapters, setChapters] = useState([])
  const [drafts, setDrafts] = useState({})
  const [form, setForm] = useState({ number: 1, title: '', pov: '', status: 'draft' })
  const [file, setFile] = useState(null)
  const [previewId, setPreviewId] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    const result = await adminApi(`/chapters?contentId=${encodeURIComponent(item.id)}`)
    setChapters(result.chapters)
    setDrafts(Object.fromEntries(result.chapters.map(chapter => [chapter.id, draftFrom(chapter)])))
    setForm(previous => ({ ...previous, number: result.chapters.reduce((max, chapter) => Math.max(max, chapter.num), 0) + 1 }))
  }, [item.id])

  useEffect(() => {
    let active = true
    adminApi(`/chapters?contentId=${encodeURIComponent(item.id)}`)
      .then(result => {
        if (!active) return
        setChapters(result.chapters)
        setDrafts(Object.fromEntries(result.chapters.map(chapter => [chapter.id, draftFrom(chapter)])))
        setForm(previous => ({ ...previous, number: result.chapters.reduce((max, chapter) => Math.max(max, chapter.num), 0) + 1 }))
      })
      .catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [item.id])

  const published = useMemo(() => chapters.filter(chapter => chapter.status === 'published').length, [chapters])

  async function add(event) {
    event.preventDefault()
    if (!file) return setMessage('Choose the complete HTML chapter file.')
    if (file.size > maxBytes) return setMessage(`Chapter HTML must be ${formatBytes(maxBytes)} or smaller.`)
    setBusy(true); setMessage('Uploading chapter…')
    try {
      const params = new URLSearchParams({ contentId: item.id, number: form.number, title: form.title, pov: form.pov, status: form.status, fileName: file.name })
      await adminApi(`/chapters?${params}`, { method: 'POST', headers: { 'Content-Type': file.type || 'text/html' }, body: file })
      setForm(previous => ({ ...previous, title: '', pov: '', status: 'draft' })); setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setMessage('Chapter uploaded.'); await load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  function updateDraft(id, key, value) {
    setDrafts(previous => ({ ...previous, [id]: { ...previous[id], [key]: value } }))
  }

  async function save(chapter) {
    setBusy(true); setMessage('Saving chapter…')
    try {
      await adminApi(`/chapters/${chapter.id}`, { method: 'PATCH', body: JSON.stringify(drafts[chapter.id]) })
      setMessage('Chapter metadata saved.'); await load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function move(chapter, direction) {
    setBusy(true)
    try { await adminApi(`/chapters/${chapter.id}`, { method: 'PATCH', body: JSON.stringify({ move: direction }) }); await load() }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function replace(chapter, replacement) {
    if (!replacement) return
    if (replacement.size > maxBytes) return setMessage(`Chapter HTML must be ${formatBytes(maxBytes)} or smaller.`)
    setBusy(true); setMessage('Replacing chapter HTML…')
    try {
      await adminApi(`/chapters/${chapter.id}?fileName=${encodeURIComponent(replacement.name)}`, { method: 'PUT', headers: { 'Content-Type': replacement.type || 'text/html' }, body: replacement })
      setMessage('Chapter HTML replaced.'); await load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function remove(chapter) {
    const detail = chapter.sourceKind === 'static' ? 'The bundled legacy HTML file will remain in Git, but it will disappear from the Chronicle.' : 'Its managed HTML file will also be removed from storage.'
    if (!window.confirm(`Delete chapter ${chapter.num}, “${chapter.title}”? ${detail}`)) return
    setBusy(true)
    try { await adminApi(`/chapters/${chapter.id}`, { method: 'DELETE' }); setMessage('Chapter deleted.'); setPreviewId(null); await load() }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  return <div className="chapter-manager">
    <div className="chapter-summary"><strong>{chapters.length} CHAPTERS</strong><span>{published} published · HTML files up to {formatBytes(maxBytes)}</span></div>
    <div className="chapter-flow" aria-label="Chapter workflow"><span>1 · ADD HTML</span><span>2 · PREVIEW</span><span>3 · PUBLISH</span></div>
    <div className="chapter-list">
      {!chapters.length && <p className="admin-muted">No chapters yet. Upload the first complete HTML document below.</p>}
      {chapters.map((chapter, index) => {
        const draft = drafts[chapter.id] || draftFrom(chapter)
        return <article className="chapter-row" key={chapter.id}>
          <div className="chapter-order"><button type="button" disabled={busy || index === 0} aria-label={`Move chapter ${chapter.num} up`} onClick={() => move(chapter, 'up')}>↑</button><button type="button" disabled={busy || index === chapters.length - 1} aria-label={`Move chapter ${chapter.num} down`} onClick={() => move(chapter, 'down')}>↓</button></div>
          <label>Number<input aria-label={`Chapter ${chapter.num} number`} type="number" min="1" max="10000" value={draft.number} onChange={event => updateDraft(chapter.id, 'number', Number(event.target.value))} /></label>
          <label className="chapter-title-field">Title<input aria-label={`Chapter ${chapter.num} title`} value={draft.title} onChange={event => updateDraft(chapter.id, 'title', event.target.value)} /></label>
          <label>POV<input aria-label={`Chapter ${chapter.num} point of view`} placeholder="Optional" value={draft.pov} onChange={event => updateDraft(chapter.id, 'pov', event.target.value)} /></label>
          <label>Status<select aria-label={`Chapter ${chapter.num} status`} value={draft.status} onChange={event => updateDraft(chapter.id, 'status', event.target.value)}><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label>
          <div className="chapter-file-meta"><span>{chapter.sourceKind === 'static' ? 'BUNDLED' : 'R2 MANAGED'}</span><small>{chapter.fileName || 'chapter.html'}{chapter.sizeBytes ? ` · ${formatBytes(chapter.sizeBytes)}` : ''}</small></div>
          <div className="chapter-actions"><button type="button" className="admin-button" disabled={busy} onClick={() => save(chapter)}>SAVE</button><button type="button" className="admin-button" aria-expanded={previewId === chapter.id} onClick={() => setPreviewId(previewId === chapter.id ? null : chapter.id)}>PREVIEW</button><label className="admin-button chapter-replace">REPLACE<input type="file" accept=".html,.htm,text/html" disabled={busy} onChange={event => { const replacement = event.target.files?.[0]; event.target.value = ''; if (replacement) void replace(chapter, replacement) }} /></label><a className="admin-button" href={`/api/admin/chapters/${chapter.id}/preview?download=1`}>DOWNLOAD</a><button type="button" className="admin-button danger" disabled={busy} onClick={() => remove(chapter)}>DELETE</button></div>
          {previewId === chapter.id && <div className="chapter-preview"><div><span>ISOLATED HTML PREVIEW</span><button type="button" onClick={() => setPreviewId(null)}>CLOSE ×</button></div><iframe title={`Preview ${chapter.title}`} sandbox="allow-scripts" src={`/api/admin/chapters/${chapter.id}/preview?v=${encodeURIComponent(chapter.updatedAt || '')}`} /></div>}
        </article>
      })}
    </div>
    <form className="admin-form-grid chapter-add" onSubmit={add}>
      <div className="wide release-guidance"><strong>ADD CHAPTER</strong><span>Upload a complete UTF-8 HTML document. New chapters start as drafts unless you explicitly publish them.</span></div>
      <label>Chapter number<input required type="number" min="1" max="10000" value={form.number} onChange={event => setForm({ ...form, number: Number(event.target.value) })} /></label>
      <label>Chapter title<input required maxLength="200" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
      <label>Point of view<input maxLength="120" placeholder="Optional" value={form.pov} onChange={event => setForm({ ...form, pov: event.target.value })} /></label>
      <label>Initial status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></label>
      <label className="wide admin-file">HTML chapter<input ref={fileRef} required type="file" accept=".html,.htm,text/html" onChange={event => setFile(event.target.files?.[0] || null)} />{file && <span>{file.name} · {formatBytes(file.size)}</span>}</label>
      <button className="admin-button primary" disabled={busy}>{busy ? 'WORKING…' : 'UPLOAD CHAPTER'}</button>
    </form>
    {message && <p className="admin-message" role="status" aria-live="polite">{message}</p>}
  </div>
}

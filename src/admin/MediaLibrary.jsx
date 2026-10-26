import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { adminApi, formatBytes } from './api'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,application/pdf,text/plain,text/csv,application/json,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm'

async function imageDimensions(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return {}
  const bitmap = await createImageBitmap(file)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}

function MediaThumb({ item }) {
  if (item.type_group === 'image') return <img src={`${item.url}?v=${item.sha256}`} alt={item.alt_text || item.display_name || item.original_name} loading="lazy" />
  return <span className="media-file-icon" aria-hidden="true">{item.type_group === 'audio' ? '♫' : item.type_group === 'video' ? '▶' : '▤'}</span>
}

export default function MediaLibrary({ canManage, navigate }) {
  const [data, setData] = useState({ items: [], folders: [], usedAssets: [] })
  const [query, setQuery] = useState('')
  const [folder, setFolder] = useState('all')
  const [type, setType] = useState('all')
  const [scope, setScope] = useState('library')
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (folder !== 'all') params.set('folder', folder)
    if (type !== 'all') params.set('type', type)
    const result = await adminApi(`/media?${params}`)
    setData(result)
    setSelected(current => current ? [...result.items, ...result.usedAssets].find(item => item.id === current.id) || null : null)
  }, [folder, query, type])

  useEffect(() => { const timer = setTimeout(() => load().catch(error => setMessage(error.message)), 180); return () => clearTimeout(timer) }, [load])
  const items = useMemo(() => scope === 'attached' ? data.usedAssets.filter(item => (!query || `${item.original_name} ${item.content_title} ${item.slot}`.toLowerCase().includes(query.toLowerCase())) && (type === 'all' || type === 'image')) : data.items, [data, query, scope, type])
  const totalBytes = items.reduce((sum, item) => sum + Number(item.size_bytes || 0), 0)

  async function uploadFiles(fileList) {
    const files = [...fileList]
    if (!files.length) return
    setBusy(true)
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        setMessage(`Uploading ${index + 1} of ${files.length}: ${file.name}`)
        const dimensions = await imageDimensions(file)
        await adminApi('/media', { method: 'POST', headers: {
          'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': file.name,
          'X-Display-Name': file.name.replace(/\.[^.]+$/, ''), ...(folder !== 'all' && folder !== 'root' ? { 'X-Folder-Id': folder } : {}),
          ...(dimensions.width ? { 'X-Image-Width': String(dimensions.width), 'X-Image-Height': String(dimensions.height) } : {}),
        }, body: file })
      }
      setMessage(`${files.length} file${files.length === 1 ? '' : 's'} uploaded.`)
      await load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false); setDragging(false); if (inputRef.current) inputRef.current.value = '' }
  }

  async function createFolder() {
    const name = window.prompt('Folder name')
    if (!name) return
    try { await adminApi('/media-folders', { method: 'POST', body: JSON.stringify({ name }) }); setMessage('Folder created.'); await load() } catch (error) { setMessage(error.message) }
  }

  async function saveItem(event) {
    event.preventDefault()
    try {
      await adminApi(`/media/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ displayName: selected.display_name, altText: selected.alt_text, folderId: selected.folder_id || '' }) })
      setMessage('Media details saved.'); await load()
    } catch (error) { setMessage(error.message) }
  }

  async function deleteItem() {
    if (!window.confirm(`Permanently delete “${selected.display_name}”? This cannot be undone.`)) return
    try { await adminApi(`/media/${selected.id}`, { method: 'DELETE' }); setSelected(null); setMessage('Media item deleted.'); await load() } catch (error) { setMessage(error.message) }
  }

  return <div className="media-library"><header className="admin-page-header"><div><p className="eyebrow">ASSET MANAGEMENT</p><h1>Media library</h1><p className="admin-muted">Upload reusable files, organize folders, and see where artwork is already used.</p></div>{canManage && <div className="media-header-actions"><button className="admin-button" onClick={createFolder}>+ FOLDER</button><button className="admin-button primary" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? 'UPLOADING…' : '↑ UPLOAD FILES'}</button><input ref={inputRef} hidden multiple type="file" accept={ACCEPT} onChange={event => uploadFiles(event.target.files)} /></div>}</header>
    <section className="media-stats"><article><strong>{items.length}</strong><span>visible files</span></article><article><strong>{formatBytes(totalBytes)}</strong><span>visible storage</span></article><article><strong>{data.folders.length}</strong><span>folders</span></article><article><strong>{data.usedAssets.length}</strong><span>content placements</span></article></section>
    <div className="media-toolbar"><input aria-label="Search media" placeholder="Search files, alt text, or content…" value={query} onChange={event => setQuery(event.target.value)} /><select aria-label="Media source" value={scope} onChange={event => setScope(event.target.value)}><option value="library">Reusable library</option><option value="attached">Attached artwork</option></select><select aria-label="Folder" disabled={scope === 'attached'} value={folder} onChange={event => setFolder(event.target.value)}><option value="all">All folders</option><option value="root">Unfiled</option>{data.folders.map(value => <option key={value.id} value={value.id}>{value.name} ({value.item_count})</option>)}</select><select aria-label="File type" value={type} onChange={event => setType(event.target.value)}><option value="all">All types</option><option value="image">Images</option><option value="document">Documents</option><option value="audio">Audio</option><option value="video">Video</option></select></div>
    {scope === 'library' && canManage && <button className={`media-dropzone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragEnter={event => { event.preventDefault(); setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); uploadFiles(event.dataTransfer.files) }}><strong>Drop files here</strong><span>Images, PDF, text, JSON, CSV, audio, or video · up to 25 MB each</span></button>}
    {message && <p className="admin-message" role="status" aria-live="polite">{message}</p>}
    {items.length ? <section className="media-grid">{items.map(item => <button key={item.id} className="media-card" onClick={() => setSelected(item)}><div className="media-thumb"><MediaThumb item={item} />{item.kind === 'attached' && <em>IN USE</em>}</div><strong>{item.display_name || item.original_name}</strong><span>{item.kind === 'attached' ? `${item.content_title} · ${item.slot}` : `${item.folder_name || 'Unfiled'} · ${formatBytes(item.size_bytes)}`}</span></button>)}</section> : <section className="admin-panel empty-state"><h2>No media found</h2><p>Upload the first file or change the current filters.</p></section>}
    {selected && <div className="permission-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null) }}><section className="permission-dialog media-dialog" role="dialog" aria-modal="true" aria-labelledby="media-title"><header><div><p className="eyebrow">{selected.kind === 'attached' ? 'ATTACHED ARTWORK' : 'MEDIA DETAILS'}</p><h2 id="media-title">{selected.display_name || selected.original_name}</h2></div><button aria-label="Close" onClick={() => setSelected(null)}>×</button></header><div className="media-detail-preview"><MediaThumb item={selected} /></div>{selected.kind === 'attached' ? <div className="media-attached-details"><p><strong>Used by:</strong> {selected.content_title}</p><p><strong>Placement:</strong> {selected.slot}</p><p><strong>Dimensions:</strong> {selected.width} × {selected.height}</p><p><strong>Size:</strong> {formatBytes(selected.size_bytes)}</p><button className="admin-button primary" onClick={() => navigate(`edit:${selected.content_type}:${selected.content_id}`)}>OPEN CONTENT ITEM</button></div> : <form className="media-detail-form" onSubmit={saveItem}><label>Display name<input value={selected.display_name} onChange={event => setSelected({ ...selected, display_name: event.target.value })} /></label><label>Alt text / description<textarea rows="3" value={selected.alt_text || ''} onChange={event => setSelected({ ...selected, alt_text: event.target.value })} /></label><label>Folder<select value={selected.folder_id || ''} onChange={event => setSelected({ ...selected, folder_id: event.target.value || null })}><option value="">Unfiled</option>{data.folders.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label><div className="media-meta"><span>{selected.mime_type}</span><span>{formatBytes(selected.size_bytes)}</span>{selected.width && <span>{selected.width} × {selected.height}</span>}<span>{selected.usage_count} uses</span></div>{canManage && <div className="dialog-actions"><button type="button" className="admin-button danger" disabled={selected.usage_count > 0} onClick={deleteItem}>DELETE PERMANENTLY</button><button className="admin-button primary">SAVE DETAILS</button></div>}</form>}</section></div>}
  </div>
}

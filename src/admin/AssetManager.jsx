import { useEffect, useRef, useState } from 'react'
import { adminApi, formatBytes } from './api'

async function loadBitmap(file) {
  return createImageBitmap(file)
}

async function prepareImage(file, spec, position, zoom) {
  const bitmap = await loadBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = spec.width
  canvas.height = spec.height
  const context = canvas.getContext('2d', { alpha: true })
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  const baseScale = Math.max(spec.width / bitmap.width, spec.height / bitmap.height)
  const scale = baseScale * zoom
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  const overflowX = Math.max(0, width - spec.width)
  const overflowY = Math.max(0, height - spec.height)
  const x = -overflowX * position.x
  const y = -overflowY * position.y
  context.clearRect(0, 0, spec.width, spec.height)
  context.drawImage(bitmap, x, y, width, height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not prepare the image.')), 'image/webp', 0.9))
}

export default function AssetManager({ item, specs, assets, onChanged }) {
  const [selectedSlot, setSelectedSlot] = useState(Object.keys(specs)[0] || '')
  const [source, setSource] = useState(null)
  const [preview, setPreview] = useState('')
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 })
  const [zoom, setZoom] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)
  const spec = specs[selectedSlot]

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  if (!Object.keys(specs).length) return <p className="admin-muted">This content type does not need image slots.</p>

  async function chooseFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setMessage('Choose an image file.')
    if (preview) URL.revokeObjectURL(preview)
    setSource(file)
    setPreview(URL.createObjectURL(file))
    setPosition({ x: 0.5, y: 0.5 })
    setZoom(1)
    setMessage('')
  }

  async function upload() {
    if (!source || !spec) return
    setBusy(true)
    setMessage('Preparing exact dimensions…')
    try {
      const blob = await prepareImage(source, spec, position, zoom)
      setMessage(`Uploading optimized ${formatBytes(blob.size)} WebP…`)
      await adminApi('/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'image/webp', 'X-Content-Id': item.id, 'X-Asset-Slot': selectedSlot,
          'X-File-Name': source.name, 'X-Image-Width': String(spec.width), 'X-Image-Height': String(spec.height),
        },
        body: blob,
      })
      setMessage('Asset saved.')
      setSource(null)
      setPreview('')
      if (inputRef.current) inputRef.current.value = ''
      await onChanged()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function remove(asset) {
    if (!window.confirm(`Remove ${asset.slot} artwork?`)) return
    try { await adminApi(`/assets/${asset.id}`, { method: 'DELETE' }); await onChanged() } catch (error) { setMessage(error.message) }
  }

  return <div className="asset-manager">
    <div className="asset-spec-grid">
      {Object.entries(specs).map(([slot, value]) => {
        const existing = assets.find(asset => asset.slot === slot)
        return <button key={slot} type="button" aria-pressed={selectedSlot === slot} className={`asset-spec ${selectedSlot === slot ? 'active' : ''}`} onClick={() => { setSelectedSlot(slot); setSource(null); setPreview('') }}>
          <span>{value.label}</span><strong>{value.width} × {value.height}</strong><small>WebP · {value.transparent ? 'transparent supported' : 'full bleed'}</small>
          {existing && <em>✓ uploaded</em>}
        </button>
      })}
    </div>
    {spec && <div className="asset-workbench">
      <div className="asset-preview" style={{ aspectRatio: `${spec.width}/${spec.height}` }}>
        {preview ? <img src={preview} alt="Crop preview" style={{ objectPosition: `${position.x * 100}% ${position.y * 100}%`, transform: `scale(${zoom})` }} /> : assets.find(asset => asset.slot === selectedSlot) ? <img src={`${assets.find(asset => asset.slot === selectedSlot).url}?v=${assets.find(asset => asset.slot === selectedSlot).sha256}`} alt={spec.label} /> : <span>NO {selectedSlot.toUpperCase()} ASSET</span>}
      </div>
      <div className="asset-controls">
        <p><strong>{spec.label}</strong><br />Output is automatically cropped, resized to {spec.width} × {spec.height}, and converted to WebP.</p>
        <label className="admin-file">Choose source image<input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={chooseFile} /></label>
        {source && <>
          <label>Horizontal focus<input type="range" min="0" max="1" step="0.01" value={position.x} onChange={event => setPosition({ ...position, x: Number(event.target.value) })} /></label>
          <label>Vertical focus<input type="range" min="0" max="1" step="0.01" value={position.y} onChange={event => setPosition({ ...position, y: Number(event.target.value) })} /></label>
          <label>Zoom<input type="range" min="1" max="2" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label>
          <button className="admin-button primary" type="button" disabled={busy} onClick={upload}>{busy ? 'PROCESSING…' : `PREPARE & UPLOAD ${selectedSlot.toUpperCase()}`}</button>
        </>}
        {assets.find(asset => asset.slot === selectedSlot) && <button className="admin-button danger" type="button" onClick={() => remove(assets.find(asset => asset.slot === selectedSlot))}>REMOVE ASSET</button>}
        {message && <p className="admin-message" role="status" aria-live="polite">{message}</p>}
      </div>
    </div>}
  </div>
}

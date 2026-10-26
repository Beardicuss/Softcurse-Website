import { useEffect, useMemo, useRef, useState } from 'react'
import { adminApi } from './api'

export default function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState('')
  const [records, setRecords] = useState([])
  const inputRef = useRef(null)
  const filtered = useMemo(() => [
    ...commands.filter(command => `${command.label} ${command.group}`.toLowerCase().includes(query.toLowerCase())),
    ...(query.trim().length >= 2 ? records : []).map(record => ({ ...record, icon: '↗', run: () => { window.location.hash = record.hash } })),
  ], [commands, query, records])
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])
  useEffect(() => {
    if (!open || query.trim().length < 2) return undefined
    const timer = setTimeout(() => adminApi(`/search?q=${encodeURIComponent(query.trim())}`).then(result => setRecords(result.results || [])).catch(() => setRecords([])), 180)
    return () => clearTimeout(timer)
  }, [open, query])
  const close = () => { setQuery(''); setRecords([]); onClose() }
  if (!open) return null
  return <div className="command-backdrop" role="presentation" onMouseDown={close}>
    <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={event => event.stopPropagation()}>
      <div className="command-search"><span>⌕</span><input ref={inputRef} aria-label="Search commands and records" placeholder="Search pages, content, media, messages…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') close(); if (event.key === 'Enter' && filtered[0]) { filtered[0].run(); close() } }} /><kbd>ESC</kbd></div>
      <div className="command-results">{filtered.length ? filtered.map(command => <button key={command.id} onClick={() => { command.run(); close() }}><span className="command-icon">{command.icon}</span><span><strong>{command.label}</strong><small>{command.detail || command.group}</small></span>{command.shortcut && <kbd>{command.shortcut}</kbd>}</button>) : <div className="command-empty">No matching command or record</div>}</div>
    </section>
  </div>
}

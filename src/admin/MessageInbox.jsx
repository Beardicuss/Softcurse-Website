import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from './api'

const STATES = ['new', 'read', 'replied', 'archived', 'spam']
const formatDate = value => value ? new Date(`${value}Z`).toLocaleString() : '—'

export default function MessageInbox({ canManage }) {
  const [data, setData] = useState({ messages: [], counts: {}, forms: [] })
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState([])
  const [notes, setNotes] = useState('')
  const [reply, setReply] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const params = new URLSearchParams({ status, q: query })
    const result = await adminApi(`/messages?${params}`)
    setData(result)
  }, [query, status])
  useEffect(() => { const timer = setTimeout(() => load().catch(error => setMessage(error.message)), 180); return () => clearTimeout(timer) }, [load])
  const total = useMemo(() => Object.values(data.counts).reduce((sum, value) => sum + Number(value), 0), [data.counts])

  async function open(item) {
    try {
      const result = await adminApi(`/messages/${item.id}`)
      setSelected({ ...result.message, events: result.events }); setNotes(result.message.admin_notes || ''); setReply('')
      if (item.status === 'new') setData(current => ({ ...current, messages: current.messages.map(value => value.id === item.id ? { ...value, status: 'read' } : value), counts: { ...current.counts, new: Math.max(0, (current.counts.new || 0) - 1), read: (current.counts.read || 0) + 1 } }))
    } catch (error) { setMessage(error.message) }
  }
  async function updateOne(nextStatus = selected.status) {
    setBusy(true)
    try { const result = await adminApi(`/messages/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, adminNotes: notes }) }); setSelected(current => ({ ...current, ...result.message })); setMessage('Message updated.'); await load() }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function bulk(nextStatus) {
    if (!checked.length) return
    setBusy(true)
    try { await adminApi('/messages', { method: 'PATCH', body: JSON.stringify({ ids: checked, status: nextStatus }) }); setChecked([]); setMessage(`${checked.length} message${checked.length === 1 ? '' : 's'} updated.`); await load() }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function sendReply(event) {
    event.preventDefault(); if (!reply.trim()) return
    setBusy(true)
    try { await adminApi(`/messages/${selected.id}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }); setReply(''); setMessage('Reply sent by email.'); await open({ ...selected, status: 'replied' }); await load() }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const exportUrl = `/api/admin/messages?${new URLSearchParams({ status, q: query, export: 'csv' })}`
  return <div className="message-inbox"><header className="admin-page-header"><div><p className="eyebrow">COMMUNICATIONS</p><h1>Messages & forms</h1><p className="admin-muted">Review contact submissions, moderate spam, add private notes, and reply by email.</p></div><a className="admin-button" href={exportUrl}>EXPORT CSV</a></header>
    {message && <p className="admin-message" role="status">{message}</p>}
    <div className="message-stats"><button className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}><strong>{total}</strong><span>ALL</span></button>{STATES.map(value => <button key={value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}><strong>{data.counts[value] || 0}</strong><span>{value}</span></button>)}</div>
    <section className="admin-panel form-health"><div><span className="status-light published" /><div><strong>{data.forms[0]?.name || 'Website contact form'}</strong><small>Turnstile protected · submissions stored in D1 · email delivery tracked</small></div></div><span className="status-chip published">{data.forms[0]?.status || 'active'}</span></section>
    <div className="message-toolbar"><input aria-label="Search messages" placeholder="Search name, email, subject, or message…" value={query} onChange={event => setQuery(event.target.value)} />{canManage && checked.length > 0 && <><span>{checked.length} selected</span><button onClick={() => bulk('read')} disabled={busy}>MARK READ</button><button onClick={() => bulk('archived')} disabled={busy}>ARCHIVE</button><button className="danger" onClick={() => bulk('spam')} disabled={busy}>SPAM</button></>}</div>
    <section className="admin-panel message-list">{data.messages.map(item => <article key={item.id} className={item.status === 'new' ? 'unread' : ''}><label onClick={event => event.stopPropagation()}><input type="checkbox" checked={checked.includes(item.id)} onChange={event => setChecked(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} aria-label={`Select message from ${item.name}`} /></label><button onClick={() => open(item)}><span className={`status-light ${item.status === 'new' ? 'published' : item.status === 'spam' ? 'archived' : ''}`} /><span><strong>{item.name}</strong><small>{item.email}</small></span><span><strong>{item.subject || 'No subject'}</strong><small>{item.message}</small></span><span className={`status-chip ${item.status}`}>{item.status}</span><time>{formatDate(item.created_at)}</time></button></article>)}{!data.messages.length && <div className="empty-state"><strong>No messages found</strong><span>New contact submissions will appear here automatically.</span></div>}</section>
    {selected && <div className="permission-backdrop" onMouseDown={event => event.target === event.currentTarget && setSelected(null)}><section className="permission-dialog message-dialog"><header><div><p className="eyebrow">{selected.status} · {selected.delivery_status} email</p><h2>{selected.subject || 'No subject'}</h2></div><button aria-label="Close message" onClick={() => setSelected(null)}>×</button></header><div className="message-dialog-body"><aside><strong>{selected.name}</strong><a href={`mailto:${selected.email}`}>{selected.email}</a><time>{formatDate(selected.created_at)}</time><p>{selected.message}</p></aside><main>{canManage && <><div className="message-actions">{STATES.filter(value => value !== selected.status).map(value => <button key={value} onClick={() => updateOne(value)} disabled={busy}>{value.toUpperCase()}</button>)}</div><label>Private team notes<textarea rows="5" value={notes} onChange={event => setNotes(event.target.value)} /></label><button className="admin-button" onClick={() => updateOne()} disabled={busy}>SAVE NOTES</button><form onSubmit={sendReply}><label>Email reply<textarea required rows="8" placeholder={`Reply to ${selected.name}…`} value={reply} onChange={event => setReply(event.target.value)} /></label><button className="admin-button primary" disabled={busy}>SEND REPLY</button></form></>}<div className="message-history"><h3>Activity</h3>{selected.events?.map(event => <div key={event.id}><strong>{event.action.replaceAll('_', ' ')}</strong><span>{event.actor}</span><time>{formatDate(event.created_at)}</time></div>)}</div></main></div></section></div>}
  </div>
}

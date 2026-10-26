import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './CommentSection.module.css'

function Comment({ item, replies = [] }) {
  return <article className={styles.comment}><header><strong>{item.authorName}</strong><time>{new Date(`${item.createdAt}Z`).toLocaleDateString()}</time></header><p>{item.body}</p>{replies.length > 0 && <div className={styles.replies}>{replies.map(child => <Comment key={child.id} item={child} />)}</div>}</article>
}

export default function CommentSection({ slug }) {
  const [comments, setComments] = useState([])
  const [form, setForm] = useState({ authorName: '', email: '', body: '', website: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(() => fetch(`/api/comments/${encodeURIComponent(slug)}`).then(response => response.ok ? response.json() : Promise.reject(new Error('Comments are unavailable.'))).then(data => setComments(data.comments || [])).catch(() => setMessage('Comments are temporarily unavailable.')), [slug])
  useEffect(() => { load() }, [load])
  const threads = useMemo(() => comments.filter(item => !item.parentId).map(item => ({ ...item, children: comments.filter(child => child.parentId === item.id) })), [comments])
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(slug)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error?.message || 'The comment could not be submitted.')
      setForm(current => ({ ...current, body: '' })); setMessage('Thank you. Your comment is awaiting moderation.')
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <section className={styles.wrap} aria-labelledby="comments-title"><div className={styles.heading}><div><span>{'// COMMUNITY'}</span><h2 id="comments-title">Comments</h2></div><strong>{comments.length}</strong></div>
    <div className={styles.list}>{threads.length ? threads.map(item => <Comment key={item.id} item={item} replies={item.children} />) : <p className={styles.empty}>No approved comments yet. Start the conversation.</p>}</div>
    <form className={styles.form} onSubmit={submit}><h3>Leave a comment</h3><p>Comments are reviewed before publication. Your email is converted to a private hash and is never displayed.</p><div><label>Name<input required maxLength="80" value={form.authorName} onChange={event => setForm({ ...form, authorName: event.target.value })} /></label><label>Email <small>(optional)</small><input type="email" maxLength="254" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label></div><label className={styles.honeypot} aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={form.website} onChange={event => setForm({ ...form, website: event.target.value })} /></label><label>Comment<textarea required rows="6" maxLength="3000" value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} /></label><footer><span role="status" aria-live="polite">{message}</span><button disabled={busy}>{busy ? 'SUBMITTING…' : 'SUBMIT FOR REVIEW'}</button></footer></form>
  </section>
}

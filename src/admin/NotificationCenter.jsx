import { useEffect, useState } from 'react'
import { adminApi } from './api'

export default function NotificationCenter({ navigate }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ notifications: [], unread: 0 })
  useEffect(() => { let active = true; adminApi('/notifications').then(result => { if (active) setData(result) }).catch(() => {}); return () => { active = false } }, [])
  async function markAll() { await adminApi('/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }) }); setData(value => ({ ...value, unread: 0, notifications: value.notifications.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() })) })) }
  async function select(item) { if (!item.readAt) await adminApi('/notifications', { method: 'PATCH', body: JSON.stringify({ id: item.id }) }); setOpen(false); if (item.actionHash) navigate(item.actionHash) }
  return <div className="notification-center"><button className="notification-bell" aria-label={`${data.unread} unread notifications`} onClick={() => setOpen(value => !value)}>♢{data.unread > 0 && <b>{data.unread}</b>}</button>{open && <section className="notification-popover"><header><strong>Notifications</strong>{data.unread > 0 && <button onClick={markAll}>MARK ALL READ</button>}</header><div>{data.notifications.length ? data.notifications.map(item => <button key={item.id} className={item.readAt ? 'read' : ''} onClick={() => select(item)}><i className={item.type} /><span><strong>{item.title}</strong><small>{item.message}</small><time>{new Date(`${item.createdAt}Z`).toLocaleString()}</time></span></button>) : <p>No notifications.</p>}</div></section>}</div>
}


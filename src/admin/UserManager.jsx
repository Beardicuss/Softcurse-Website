import { useCallback, useEffect, useState } from 'react'
import { adminApi } from './api'
import DataTable from './DataTable'

export default function UserManager() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [editingRole, setEditingRole] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '', roleIds: ['role-editor'] })
  const load = useCallback(async () => {
    try {
      const [userResult, roleResult] = await Promise.all([adminApi('/users'), adminApi('/roles')])
      setUsers(userResult.users); setRoles(roleResult.roles); setPermissions(roleResult.permissions); setMessage('')
    } catch (error) { setMessage(error.message) }
  }, [])
  useEffect(() => {
    let active = true
    Promise.all([adminApi('/users'), adminApi('/roles')]).then(([userResult, roleResult]) => {
      if (!active) return
      setUsers(userResult.users); setRoles(roleResult.roles); setPermissions(roleResult.permissions); setMessage('')
    }).catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [])
  async function create(event) {
    event.preventDefault(); setMessage('Creating administrator…')
    try {
      await adminApi('/users', { method: 'POST', body: JSON.stringify(form) })
      setForm({ username: '', displayName: '', email: '', password: '', roleIds: ['role-editor'] }); setShowCreate(false); await load(); setMessage('Administrator created. A password change will be required.')
    } catch (error) { setMessage(error.message) }
  }
  async function toggleStatus(user) {
    const status = user.status === 'active' ? 'suspended' : 'active'
    if (!window.confirm(`${status === 'active' ? 'Reactivate' : 'Suspend'} ${user.username}?`)) return
    try { await adminApi(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load() } catch (error) { setMessage(error.message) }
  }
  async function savePermissions() {
    try { await adminApi(`/roles/${editingRole.id}`, { method: 'PATCH', body: JSON.stringify({ permissions: editingRole.permissions }) }); setEditingRole(null); await load(); setMessage('Role permissions saved.') } catch (error) { setMessage(error.message) }
  }
  const columns = [
    { key: 'user', label: 'Administrator', render: user => <div className="table-title"><span className={`user-avatar ${user.status}`}>{(user.displayName || user.username).slice(0, 2).toUpperCase()}</span><span><strong>{user.displayName || user.username}</strong><small>@{user.username}{user.email ? ` · ${user.email}` : ''}</small></span></div> },
    { key: 'roles', label: 'Role', render: user => user.roles.map(role => <span className="role-chip" key={role.id}>{role.name}</span>) },
    { key: 'status', label: 'Status', render: user => <span className={`status-chip ${user.status === 'active' ? 'published' : 'archived'}`}>{user.status}</span> },
    { key: 'lastLoginAt', label: 'Last sign-in', render: user => <time>{user.lastLoginAt ? new Date(`${user.lastLoginAt}Z`).toLocaleString() : 'Never'}</time> },
    { key: 'actions', label: '', render: user => user.current ? <span className="status-chip published">CURRENT</span> : <button className="admin-button compact" onClick={event => { event.stopPropagation(); toggleStatus(user) }}>{user.status === 'active' ? 'SUSPEND' : 'ACTIVATE'}</button> },
  ]
  const permissionGroups = permissions.reduce((groups, permission) => ({ ...groups, [permission.group_name]: [...(groups[permission.group_name] || []), permission] }), {})
  return <div><header className="admin-page-header"><div><p className="eyebrow">ACCESS CONTROL</p><h1>Administrators</h1><p className="admin-muted">Manage operator accounts and server-enforced roles.</p></div><button className="admin-button primary" onClick={() => setShowCreate(value => !value)}>{showCreate ? 'CANCEL' : '+ NEW ADMIN'}</button></header>
    {showCreate && <form className="admin-panel create-user-form" onSubmit={create}><div className="panel-heading"><h2>Create administrator</h2><span>Temporary credentials</span></div><div className="admin-form-grid"><label>Username<input required minLength="3" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label><label>Display name<input required value={form.displayName} onChange={event => setForm({ ...form, displayName: event.target.value })} /></label><label>Email<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label><label>Temporary password<input required type="password" minLength="12" autoComplete="new-password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label><label className="wide">Role<select value={form.roleIds[0]} onChange={event => setForm({ ...form, roleIds: [event.target.value] })}>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><div className="wide"><button className="admin-button primary">CREATE ADMINISTRATOR</button></div></div></form>}
    {message && <p className={message.includes('created') ? 'admin-message' : 'admin-error'}>{message}</p>}
    <section className="admin-panel content-table"><DataTable columns={columns} rows={users} emptyTitle="No administrators found" emptyText="Create the first database-backed administrator." /></section>
    <section className="admin-panel role-overview"><div className="panel-heading"><h2>Role matrix</h2><span>{roles.length} system roles</span></div><div className="role-grid">{roles.map(role => <article key={role.id}><div><strong>{role.name}</strong><span>{role.userCount} users</span></div><p>{role.description}</p><footer><small>{role.permissions.length} permissions</small>{role.id !== 'role-super-admin' && <button className="admin-button compact" onClick={() => setEditingRole({ ...role, permissions: [...role.permissions] })}>EDIT</button>}</footer></article>)}</div></section>
    {editingRole && <div className="permission-backdrop" onMouseDown={() => setEditingRole(null)}><section className="permission-dialog" role="dialog" aria-modal="true" aria-label={`Edit ${editingRole.name} permissions`} onMouseDown={event => event.stopPropagation()}><div className="panel-heading"><div><p className="eyebrow">ROLE PERMISSIONS</p><h2>{editingRole.name}</h2></div><button className="icon-button" onClick={() => setEditingRole(null)}>✕</button></div><div className="permission-matrix">{Object.entries(permissionGroups).map(([group, groupPermissions]) => <fieldset key={group}><legend>{group}</legend>{groupPermissions.map(permission => <label key={permission.key}><input type="checkbox" checked={editingRole.permissions.includes(permission.key)} onChange={event => setEditingRole(value => ({ ...value, permissions: event.target.checked ? [...value.permissions, permission.key] : value.permissions.filter(key => key !== permission.key) }))} /><span><strong>{permission.key}</strong><small>{permission.description}</small></span></label>)}</fieldset>)}</div><footer className="dialog-actions"><button className="admin-button" onClick={() => setEditingRole(null)}>CANCEL</button><button className="admin-button primary" onClick={savePermissions}>SAVE PERMISSIONS</button></footer></section></div>}
  </div>
}

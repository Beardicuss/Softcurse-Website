import { useCallback, useEffect, useState } from 'react'
import { adminApi } from './api'
import DataTable from './DataTable'

export function PasswordChange({ required = false, onChanged }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (form.newPassword !== form.confirmPassword) { setMessage('New passwords do not match.'); return }
    setBusy(true); setMessage('')
    try {
      await adminApi('/auth/change-password', { method: 'POST', body: JSON.stringify(form) })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setMessage('Password changed. Other sessions were signed out.'); onChanged?.()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <section className={`admin-panel password-panel ${required ? 'required-password' : ''}`}><div className="panel-heading"><h2>{required ? 'Password change required' : 'Change password'}</h2><span>{required ? 'Before continuing' : 'Security'}</span></div>{required && <p className="admin-muted">An administrator created this account with a temporary password. Choose a private password to continue.</p>}<form onSubmit={submit} className="password-form"><label>Current password<input required type="password" autoComplete="current-password" value={form.currentPassword} onChange={event => setForm({ ...form, currentPassword: event.target.value })} /></label><label>New password<input required minLength="12" type="password" autoComplete="new-password" value={form.newPassword} onChange={event => setForm({ ...form, newPassword: event.target.value })} /></label><label>Confirm new password<input required minLength="12" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} /></label>{message && <p className="admin-message" role="status">{message}</p>}<button className="admin-button primary" disabled={busy}>{busy ? 'UPDATING…' : 'UPDATE PASSWORD'}</button></form></section>
}

export default function SecurityManager() {
  const [sessions, setSessions] = useState([])
  const [message, setMessage] = useState('')
  const [twoFactor, setTwoFactor] = useState({ enabled: false, pending: false, recoveryCodes: 0 })
  const [setup, setSetup] = useState(null)
  const [twoFactorForm, setTwoFactorForm] = useState({ currentPassword: '', code: '' })
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const load = useCallback(() => adminApi('/security/sessions').then(result => setSessions(result.sessions)).catch(error => setMessage(error.message)), [])
  useEffect(() => { let active = true; Promise.all([adminApi('/security/sessions'), adminApi('/security/two-factor')]).then(([sessionResult, factorResult]) => { if (active) { setSessions(sessionResult.sessions); setTwoFactor(factorResult) } }).catch(error => { if (active) setMessage(error.message) }); return () => { active = false } }, [])
  async function revoke(session) {
    if (!window.confirm(`Revoke the session for ${session.username}?`)) return
    try { await adminApi(`/security/sessions/${session.id}`, { method: 'DELETE' }); await load(); setMessage('Session revoked.') } catch (error) { setMessage(error.message) }
  }
  async function beginTwoFactor(event) {
    event.preventDefault(); setMessage('')
    try { setSetup(await adminApi('/security/two-factor', { method: 'POST', body: JSON.stringify({ currentPassword: twoFactorForm.currentPassword }) })); setTwoFactorForm(value => ({ ...value, code: '' })) } catch (error) { setMessage(error.message) }
  }
  async function verifyTwoFactor() {
    try { const result = await adminApi('/security/two-factor', { method: 'PUT', body: JSON.stringify({ code: twoFactorForm.code }) }); setRecoveryCodes(result.recoveryCodes); setSetup(null); setTwoFactor({ enabled: true, pending: false, recoveryCodes: result.recoveryCodes.length }); setTwoFactorForm({ currentPassword: '', code: '' }); setMessage('Two-factor authentication enabled.') } catch (error) { setMessage(error.message) }
  }
  async function disableTwoFactor(event) {
    event.preventDefault()
    if (!window.confirm('Disable two-factor authentication for this account?')) return
    try { await adminApi('/security/two-factor', { method: 'DELETE', body: JSON.stringify({ currentPassword: twoFactorForm.currentPassword }) }); setTwoFactor({ enabled: false, pending: false, recoveryCodes: 0 }); setTwoFactorForm({ currentPassword: '', code: '' }); setRecoveryCodes([]); setMessage('Two-factor authentication disabled.') } catch (error) { setMessage(error.message) }
  }
  const columns = [
    { key: 'device', label: 'Device', render: session => <div className="table-title"><span><strong>{session.current ? 'This device' : 'Admin session'}</strong><small>{session.userAgent || 'Unknown browser'}</small></span></div> },
    { key: 'username', label: 'Operator' },
    { key: 'ipHash', label: 'IP fingerprint', render: session => <code>{session.ipHash}</code> },
    { key: 'lastSeenAt', label: 'Last active', render: session => <time>{new Date(`${session.lastSeenAt}Z`).toLocaleString()}</time> },
    { key: 'action', label: '', render: session => session.current ? <span className="status-chip published">CURRENT</span> : <button className="admin-button compact danger" onClick={event => { event.stopPropagation(); revoke(session) }}>REVOKE</button> },
  ]
  return <div><header className="admin-page-header"><div><p className="eyebrow">SECURITY CENTER</p><h1>Sessions & password</h1><p className="admin-muted">Review signed-in devices and protect your account.</p></div><span className="system-online">● PROTECTED</span></header>{message && <p className="admin-message">{message}</p>}<section className="admin-panel content-table"><div className="panel-heading security-heading"><h2>Active sessions</h2><span>{sessions.length} active</span></div><DataTable columns={columns} rows={sessions} emptyTitle="No active sessions" emptyText="Sessions will appear after a successful login." /></section>
    <section className="admin-panel two-factor-panel"><div className="panel-heading"><div><h2>Two-factor authentication</h2><p className="admin-muted">Use any TOTP authenticator app. No paid service is required.</p></div><span className={`status-chip ${twoFactor.enabled ? 'published' : ''}`}>{twoFactor.enabled ? 'ENABLED' : 'DISABLED'}</span></div>{!twoFactor.enabled && !setup && <form onSubmit={beginTwoFactor} className="inline-security-form"><label>Confirm current password<input required type="password" autoComplete="current-password" value={twoFactorForm.currentPassword} onChange={event => setTwoFactorForm({ ...twoFactorForm, currentPassword: event.target.value })} /></label><button className="admin-button primary">SET UP AUTHENTICATOR</button></form>}{setup && <div className="totp-setup"><p>In your authenticator app, choose <strong>enter setup key</strong>, then use:</p><code>{setup.secret}</code><small>Account: softcurse · Type: time-based · 6 digits · 30 seconds</small><label>Enter the generated code<input required inputMode="numeric" autoComplete="one-time-code" value={twoFactorForm.code} onChange={event => setTwoFactorForm({ ...twoFactorForm, code: event.target.value })} /></label><button className="admin-button primary" onClick={verifyTwoFactor}>VERIFY & ENABLE</button></div>}{twoFactor.enabled && <form onSubmit={disableTwoFactor} className="inline-security-form"><div><strong>Authenticator protection is active.</strong><p className="admin-muted">{twoFactor.recoveryCodes} unused recovery codes remain.</p></div><label>Current password<input required type="password" autoComplete="current-password" value={twoFactorForm.currentPassword} onChange={event => setTwoFactorForm({ ...twoFactorForm, currentPassword: event.target.value })} /></label><button className="admin-button danger">DISABLE 2FA</button></form>}{recoveryCodes.length > 0 && <div className="recovery-codes" role="status"><h3>Save these recovery codes now</h3><p>Each code works once. They will not be shown again.</p><div>{recoveryCodes.map(code => <code key={code}>{code}</code>)}</div></div>}</section><PasswordChange /></div>
}

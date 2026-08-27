import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from './api'

const EMPTY_GRANT = { email: '', source: 'manual', expiresAt: '', note: '' }

export default function EntitlementManager({ item, releases }) {
  const [configured, setConfigured] = useState(false)
  const [entitlements, setEntitlements] = useState([])
  const [grant, setGrant] = useState(EMPTY_GRANT)
  const [releaseId, setReleaseId] = useState('')
  const [message, setMessage] = useState('')
  const [issued, setIssued] = useState(null)
  const [busy, setBusy] = useState(false)
  const managedReleases = useMemo(() => releases.filter(release => release.kind === 'file' && release.status === 'published'), [releases])

  const load = useCallback(async () => {
    const result = await adminApi(`/entitlements?contentId=${encodeURIComponent(item.id)}`)
    setConfigured(result.configured)
    setEntitlements(result.entitlements)
  }, [item.id])

  useEffect(() => {
    let active = true
    adminApi(`/entitlements?contentId=${encodeURIComponent(item.id)}`)
      .then(result => { if (active) { setConfigured(result.configured); setEntitlements(result.entitlements) } })
      .catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [item.id])
  const effectiveReleaseId = managedReleases.some(release => release.id === releaseId) ? releaseId : managedReleases[0]?.id || ''

  async function submitGrant(event) {
    event.preventDefault(); setBusy(true); setMessage('Granting access…'); setIssued(null)
    try {
      await adminApi('/entitlements', { method: 'POST', body: JSON.stringify({ ...grant, contentId: item.id, expiresAt: grant.expiresAt ? new Date(grant.expiresAt).toISOString() : null }) })
      setGrant(EMPTY_GRANT); setMessage('Customer entitlement granted.'); await load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function setStatus(entitlement, status) {
    if (status === 'revoked' && !window.confirm('Revoke this entitlement, its licenses, and active download links?')) return
    setBusy(true); setIssued(null)
    try {
      await adminApi(`/entitlements/${entitlement.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setMessage(status === 'active' ? 'Entitlement reactivated. Existing licenses and links remain revoked.' : 'Entitlement and active access credentials revoked.')
      await load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function issueLicense(entitlement) {
    const activationLimit = window.prompt('Activation limit (leave empty for no limit):', '1')
    if (activationLimit === null) return
    setBusy(true); setIssued(null)
    try {
      const result = await adminApi(`/entitlements/${entitlement.id}`, { method: 'POST', body: JSON.stringify({ action: 'issue_license', activationLimit }) })
      setIssued({ label: 'ONE-TIME LICENSE KEY', value: result.license, notice: result.notice }); setMessage('License issued.'); await load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function issueDownload(entitlement) {
    if (!effectiveReleaseId) return setMessage('Publish an R2-managed release before creating protected links.')
    setBusy(true); setIssued(null)
    try {
      const result = await adminApi(`/entitlements/${entitlement.id}`, { method: 'POST', body: JSON.stringify({ action: 'issue_download', releaseId: effectiveReleaseId, ttlMinutes: 60, maxUses: 10 }) })
      setIssued({ label: 'ONE-TIME DOWNLOAD LINK', value: `${window.location.origin}${result.url}`, notice: `${result.notice} Expires ${new Date(result.expiresAt).toLocaleString()}.` })
      setMessage('Protected download link created.'); await load()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  async function copyIssued() {
    try { await navigator.clipboard.writeText(issued.value); setMessage('Copied to clipboard.') } catch { setMessage('Copy failed. Select the value manually.') }
  }

  return <section className="entitlement-manager">
    <div className="panel-heading"><h2>Entitlements & delivery</h2><span>Manual access foundation</span></div>
    {!configured && <div className="commerce-lock"><strong>IDENTITY KEY NOT CONFIGURED</strong><span>Customer records and access mutations remain locked until COMMERCE_DATA_KEY is added during payment activation. No email addresses are stored in plain text.</span></div>}
    {configured && <form className="admin-form-grid entitlement-grant" onSubmit={submitGrant}>
      <label>Customer email<input required type="email" autoComplete="off" value={grant.email} onChange={event => setGrant({ ...grant, email: event.target.value })} /></label>
      <label>Grant source<select value={grant.source} onChange={event => setGrant({ ...grant, source: event.target.value })}><option value="manual">manual</option><option value="promotion">promotion</option><option value="support">support</option></select></label>
      <label>Optional expiry<input type="datetime-local" value={grant.expiresAt} onChange={event => setGrant({ ...grant, expiresAt: event.target.value })} /></label>
      <label>Internal note<input maxLength="500" value={grant.note} onChange={event => setGrant({ ...grant, note: event.target.value })} /></label>
      <button className="admin-button primary" disabled={busy}>GRANT ACCESS</button>
    </form>}
    <div className="protected-release-select"><label>Protected R2 release<select value={effectiveReleaseId} onChange={event => setReleaseId(event.target.value)}><option value="">No published managed release</option>{managedReleases.map(release => <option key={release.id} value={release.id}>{release.label}{release.version ? ` · v${release.version}` : ''}</option>)}</select></label><small>External GitHub, MEGA, and store links cannot be made private by this token system.</small></div>
    {issued && <div className="issued-secret" role="status"><span>{issued.label}</span><code>{issued.value}</code><button type="button" className="admin-button" onClick={copyIssued}>COPY</button><small>{issued.notice}</small></div>}
    <div className="entitlement-list">
      {!entitlements.length && <p className="admin-muted">No customer entitlements for this product.</p>}
      {entitlements.map(entitlement => <article key={entitlement.id}>
        <div><strong>Customer {entitlement.customerRef}</strong><span>{entitlement.source} · granted {new Date(`${entitlement.grantedAt}Z`).toLocaleString()}</span><small>{entitlement.expiresAt ? `Expires ${new Date(entitlement.expiresAt).toLocaleString()}` : 'No expiry'} · {entitlement.licenseCount} licenses · {entitlement.downloadTokenCount} active links</small></div>
        <div className="entitlement-actions"><span className={`status-chip ${entitlement.status}`}>{entitlement.status}</span>{entitlement.status === 'active' ? <><button type="button" className="admin-button" disabled={busy || !configured} onClick={() => issueLicense(entitlement)}>LICENSE</button><button type="button" className="admin-button" disabled={busy || !configured || !effectiveReleaseId} onClick={() => issueDownload(entitlement)}>LINK</button><button type="button" className="admin-button danger" disabled={busy || !configured} onClick={() => setStatus(entitlement, 'revoked')}>REVOKE</button></> : <button type="button" className="admin-button" disabled={busy || !configured} onClick={() => setStatus(entitlement, 'active')}>REACTIVATE</button>}</div>
      </article>)}
    </div>
    {message && <p className="admin-message" role="status" aria-live="polite">{message}</p>}
  </section>
}

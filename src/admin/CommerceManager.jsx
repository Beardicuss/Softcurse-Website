import { useEffect, useState } from 'react'
import { adminApi } from './api'
import EntitlementManager from './EntitlementManager'

const providerNames = { stripe: 'Stripe', lemon_squeezy: 'Lemon Squeezy', itchio: 'itch.io', gumroad: 'Gumroad', custom: 'Custom provider' }

export default function CommerceManager({ item, schema, releases }) {
  const [value, setValue] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    adminApi(`/commerce/${item.id}`).then(result => { if (active) setValue(result.commerce) }).catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [item.id])

  if (!value) return <div className="admin-loading">LOADING COMMERCE POLICY…</div>
  const update = (key, next) => setValue({ ...value, [key]: next })
  const price = value.priceMinor == null ? '' : (value.priceMinor / 100).toFixed(2)
  const comparePrice = value.compareAtPriceMinor == null ? '' : (value.compareAtPriceMinor / 100).toFixed(2)

  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('Saving commerce policy…')
    try {
      const payload = {
        ...value,
        priceMinor: price === '' ? null : Math.round(Number(price) * 100),
        compareAtPriceMinor: comparePrice === '' ? null : Math.round(Number(comparePrice) * 100),
      }
      const result = await adminApi(`/commerce/${item.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      setValue(result.commerce); setMessage('Commerce policy saved. Live selling remains server-locked.')
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const paid = value.saleMode === 'paid'
  const externalStore = value.saleMode === 'external_store'
  return <><form className="admin-form-grid commerce-manager" onSubmit={save}>
    <div className="commerce-lock wide"><strong>COMMERCE FOUNDATION // DORMANT</strong><span>Pricing and provider references can be prepared now. Live sales cannot activate until payment webhooks, legal policy, and secrets are configured.</span></div>
    <label>Sale mode<select value={value.saleMode} onChange={event => update('saleMode', event.target.value)}>{schema.saleModes.map(mode => <option value={mode} key={mode}>{mode.replace('_', ' ')}</option>)}</select></label>
    <label>Storefront visibility<select value={value.storefrontStatus} onChange={event => update('storefrontStatus', event.target.value)}>{schema.storefrontStatuses.map(status => <option value={status} key={status}>{status}{status === 'live' ? ' (locked)' : ''}</option>)}</select></label>
    {(paid || value.saleMode === 'free') && <>
      <label>Price<input type="number" min="0" step="0.01" value={price} disabled={!paid} onChange={event => update('priceMinor', event.target.value === '' ? null : Math.round(Number(event.target.value) * 100))} /></label>
      <label>Compare-at price<input type="number" min="0" step="0.01" value={comparePrice} disabled={!paid} onChange={event => update('compareAtPriceMinor', event.target.value === '' ? null : Math.round(Number(event.target.value) * 100))} /></label>
      <label>Currency<input maxLength="3" pattern="[A-Za-z]{3}" value={value.currency} onChange={event => update('currency', event.target.value.toUpperCase())} /></label>
    </>}
    {paid && <>
      <label>Checkout provider<select value={value.checkoutProvider || ''} onChange={event => update('checkoutProvider', event.target.value || null)}><option value="">Choose later</option>{schema.checkoutProviders.map(provider => <option value={provider} key={provider}>{providerNames[provider]}</option>)}</select></label>
      <label>Provider product / variant ID<input value={value.checkoutReference || ''} onChange={event => update('checkoutReference', event.target.value)} /></label>
      <label className="check"><input type="checkbox" checked={value.requiresEntitlement} onChange={event => update('requiresEntitlement', event.target.checked)} /> Require purchase entitlement for downloads</label>
    </>}
    {externalStore && <label className="wide">External store URL<input required type="url" placeholder="https://softcurse.itch.io/game" value={value.externalStoreUrl || ''} onChange={event => update('externalStoreUrl', event.target.value)} /></label>}
    <div className="wide commerce-summary"><span>PUBLIC STATE</span><strong>{value.storefrontStatus === 'disabled' ? 'No pricing or buy controls are visible.' : value.storefrontStatus === 'preview' ? 'Coming-soon commerce UI may be previewed without accepting payment.' : 'Activation requires server-side commerce enablement.'}</strong></div>
    <button className="admin-button primary" disabled={busy}>{busy ? 'SAVING…' : 'SAVE COMMERCE POLICY'}</button>
    {message && <p className="admin-message wide" role="status">{message}</p>}
  </form><EntitlementManager item={item} releases={releases} /></>
}

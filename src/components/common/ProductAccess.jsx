import Button from './Button'
import styles from './ProductAccess.module.css'

const providerNames = { softcurse: 'Softcurse', github: 'GitHub', mega: 'MEGA', itchio: 'itch.io', google_drive: 'Google Drive', onedrive: 'OneDrive', dropbox: 'Dropbox', custom: 'External host' }

function formatBytes(bytes) {
  if (!bytes) return null
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

function formatPrice(commerce) {
  if (commerce?.priceMinor == null) return null
  try { return new Intl.NumberFormat('en', { style: 'currency', currency: commerce.currency || 'USD' }).format(commerce.priceMinor / 100) }
  catch { return `${(commerce.priceMinor / 100).toFixed(2)} ${commerce.currency || 'USD'}` }
}

export function ProductPrimaryActions({ product, emptyLabel = 'IN DEVELOPMENT' }) {
  const commerce = product.commerce || { saleMode: 'free', storefrontStatus: 'disabled' }
  const downloads = product.downloadReleases || []
  const primaryDownload = downloads.find(release => release.isPrimary) || downloads[0]
  const store = product.storeReleases?.find(release => release.isPrimary) || product.storeReleases?.[0]
  const price = formatPrice(commerce)

  if (commerce.saleMode === 'paid') {
    if (commerce.storefrontStatus === 'live') return <Button variant="magenta" disabled>BUY {price || ''}</Button>
    if (commerce.storefrontStatus === 'preview') return <Button variant="outlineMagenta" disabled>COMING SOON {price ? `— ${price}` : ''}</Button>
    return <Button variant="outline" disabled>NOT FOR SALE YET</Button>
  }
  if (commerce.saleMode === 'external_store' && commerce.storefrontStatus !== 'disabled') {
    return <Button variant="magenta" external={commerce.externalStoreUrl || store?.url}>VIEW STORE</Button>
  }
  return <>
    {product.playUrl && <Button variant="cyan" external={product.playUrl}>▶ {product.launchLabel || 'PLAY NOW'}</Button>}
    {primaryDownload && <Button variant="cyan" external={primaryDownload.url}>↓ {primaryDownload.label}</Button>}
    {!product.playUrl && !primaryDownload && <Button variant="outline" disabled>{emptyLabel}</Button>}
  </>
}

export function ProductReleasePanel({ product }) {
  if (product.commerce?.saleMode && product.commerce.saleMode !== 'free') return null
  const releases = product.downloadReleases || []
  if (!releases.length) return null
  const primary = releases.find(release => release.isPrimary) || releases[0]
  const mirrors = releases.filter(release => release.id !== primary.id)
  return <section className={styles.panel} aria-labelledby="product-downloads-title">
    <div className={styles.label}>{'// RELEASE INFORMATION'}</div>
    <h2 id="product-downloads-title">Current build</h2>
    <ReleaseRow release={primary} primary />
    {mirrors.length > 0 && <div className={styles.mirrors}><h3>Alternative downloads</h3>{mirrors.map(release => <ReleaseRow key={release.id} release={release} showAction />)}</div>}
    {primary.sha256 && <p className={styles.safety}>Verify the installer against the SHA-256 checksum before running it.</p>}
  </section>
}

function ReleaseRow({ release, primary = false, showAction = false }) {
  const size = formatBytes(release.sizeBytes)
  return <article className={`${styles.release} ${primary ? styles.primary : ''}`}>
    <div className={styles.releaseMain}>
      <span className={styles.provider}>{providerNames[release.provider] || release.provider || 'Download'}{primary ? ' · PRIMARY' : ' · MIRROR'}</span>
      <strong>{release.fileName || release.label}</strong>
      <span>{[release.version && `v${release.version}`, release.channel, release.platform, release.architecture, size].filter(Boolean).join(' · ')}</span>
      {release.releaseNotes && <div className={styles.notes}><b>Release notes</b><p>{release.releaseNotes}</p></div>}
      {release.sha256 && <div className={styles.checksum}><b>SHA-256</b><code title="SHA-256 checksum">{release.sha256}</code></div>}
    </div>
    {showAction && <Button variant="outline" external={release.url}>↓ {release.label || 'Download'}</Button>}
  </article>
}

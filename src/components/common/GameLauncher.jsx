import Button from './Button'
import styles from './GameLauncher.module.css'

export default function GameLauncher({ game }) {
  if (!game?.playUrl) return null

  const endpoint = new URL(game.playUrl).hostname
  const launchLabel = game.launchLabel || 'PLAY NOW'

  return (
    <section className={styles.launcher} aria-labelledby={`${game.id}-launcher-title`}>
      <div className={styles.scanline} aria-hidden="true" />
      <div className={styles.identity}>
        <span className={styles.eyebrow}>{'// WEB LAUNCHER'}</span>
        <h2 id={`${game.id}-launcher-title`} className={styles.title}>{game.name}</h2>
        <p className={styles.summary}>
          No installation required. Launch the current browser build in a new tab.
        </p>
      </div>

      <dl className={styles.telemetry}>
        <div>
          <dt>STATUS</dt>
          <dd className={styles.online}><span aria-hidden="true" /> ONLINE</dd>
        </div>
        <div>
          <dt>BUILD</dt>
          <dd>{game.version || 'LATEST'}</dd>
        </div>
        <div>
          <dt>PLATFORM</dt>
          <dd>{game.platforms?.join(' · ') || 'WEB'}</dd>
        </div>
        <div>
          <dt>ENDPOINT</dt>
          <dd title={endpoint}>{endpoint}</dd>
        </div>
      </dl>

      <div className={styles.action}>
        <Button variant="cyan" external={game.playUrl} aria-label={`Launch ${game.name} in a new tab`}>
          ▶ {launchLabel}
        </Button>
        <span>EXTERNAL SESSION ↗</span>
      </div>
    </section>
  )
}

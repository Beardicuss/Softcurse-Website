import { getApps } from '../../data/apps'
import AppCard from '../../components/common/AppCard'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from './Lab.module.css'

export default function Lab() {
  usePageTitle('The Lab')
  const active  = getApps('active')
  const inDev   = getApps('dev')
  const planned = getApps('planned')

  return (
    <div>
      <div className="page-header grid-bg">
        <div className="scanline" />
        <div className="page-header__eyebrow">// SOFTCURSE</div>
        <h1 className="page-header__title">THE LAB</h1>
        <p className="page-header__desc">
          Nine tools. Built sharp. Built dark. Each one a precise solution to
          a real problem in the digital world. No bloat. No compromise.
        </p>
      </div>

      <div className="container section">

        {active.length > 0 && (
          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupDot} style={{ background: 'var(--green)' }} />
              <span className={styles.groupLabel}>LIVE — Ready to use</span>
            </div>
            <div className="card-grid">
              {active.map(a => <AppCard key={a.id} app={a} />)}
            </div>
          </div>
        )}

        {inDev.length > 0 && (
          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupDot} style={{ background: 'var(--magenta)' }} />
              <span className={styles.groupLabel}>IN DEVELOPMENT — Coming soon</span>
            </div>
            <div className="card-grid">
              {inDev.map(a => <AppCard key={a.id} app={a} />)}
            </div>
          </div>
        )}

        {planned.length > 0 && (
          <div className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupDot} style={{ background: 'var(--muted)' }} />
              <span className={styles.groupLabel}>PLANNED — In the pipeline</span>
            </div>
            <div className="card-grid">
              {planned.map(a => <AppCard key={a.id} app={a} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

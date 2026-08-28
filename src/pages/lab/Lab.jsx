import { APPS } from '../../data/apps'
import { useCmsItems } from '../../content/CmsContent'
import AppCard from '../../components/common/AppCard'
import { useSEO } from '../../hooks/useSEO'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import styles from './Lab.module.css'

export default function Lab() {
  useSEO({ title: 'Apps & Tools', description: 'Softcurse applications and tools built to solve specific problems without compromise.', url: '/lab/apps' })
  usePageTitle('Apps & Tools')
  const [r1,v1] = useScrollReveal()
  const [r2,v2] = useScrollReveal()
  const [r3,v3] = useScrollReveal()
  const apps = useCmsItems('app', Object.values(APPS))
  const active  = apps.filter(item => item.status === 'active' || item.status === 'beta')
  const inDev   = apps.filter(item => item.status === 'dev')
  const planned = apps.filter(item => item.status === 'planned')

  return (
    <div>
      <div className="page-header grid-bg">
        <div className="scanline" />
        <div className="page-header__eyebrow">{"// SOFTCURSE"}</div>
        <h1 className="page-header__title">APPS &amp; TOOLS</h1>
        <p className="page-header__desc">
          Built sharp. Built dark. Each one a precise solution to
          a real problem in the digital world. No bloat. No compromise.
        </p>
      </div>

      <div className="container section">

        {active.length > 0 && (
          <div ref={r1} className={`${styles.group} reveal ${v1 ? 'visible' : ''}`}>
            <div className={styles.groupHeader}>
              <span className={styles.groupDot} style={{ background: 'var(--green)' }} />
              <span className={styles.groupLabel}>AVAILABLE — Ready to use or test</span>
            </div>
            <div className="card-grid">
              {active.map(a => <AppCard key={a.id} app={a} />)}
            </div>
          </div>
        )}

        {inDev.length > 0 && (
          <div ref={r2} className={`${styles.group} reveal ${v2 ? 'visible' : ''}`}>
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
          <div ref={r3} className={`${styles.group} reveal ${v3 ? 'visible' : ''}`}>
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

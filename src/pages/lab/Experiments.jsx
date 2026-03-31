import { Link } from 'react-router-dom'
import { getExperiments } from '../../data/experiments'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import AppCard from '../../components/common/AppCard'
import styles from './Experiments.module.css'

export default function Experiments() {
  usePageTitle('Experiments')
  useSEO({
    title: 'Experiments',
    description: 'Softcurse Experiments — a sandbox for half-built ideas, proof-of-concepts, and things that felt worth building. No promises. No deadlines.',
    url: '/experiments',
  })

  const [headerRef, headerVis] = useScrollReveal(0.05)
  const [gridRef,   gridVis]   = useScrollReveal()
  const experiments = getExperiments()

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={`page-header ${styles.pageHeader}`} ref={headerRef}>
        <div className={`${styles.headerInner} ${headerVis ? styles.visible : ''}`}>
          <div className={styles.breadcrumb}>
            <Link to="/lab" className={styles.breadcrumbLink}>LAB</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>EXPERIMENTS</span>
          </div>
          <h1 className={styles.title}>
            SOFTCURSE <span className="text-cyan">EXPERIMENTS</span>
          </h1>
          <p className={styles.desc}>
            A sandbox for half-built ideas, proof-of-concepts, and things
            that felt worth building. No promises. No roadmap. No deadlines.
            Just code that exists because someone was curious.
          </p>

          <div className={styles.infoRow}>
            <div className={styles.infoTag}>◎ NO RELEASE DATES</div>
            <div className={styles.infoTag}>◎ MAY BREAK</div>
            <div className={styles.infoTag}>◎ MAY BECOME REAL</div>
          </div>
        </div>
      </div>

      {/* ── Experiments grid ── */}
      <div className="container" style={{ paddingBottom: '6rem' }}>
        {experiments.length > 0 ? (
          <div
            ref={gridRef}
            className={`card-grid reveal ${gridVis ? 'visible' : ''}`}
          >
            {experiments.map(e => <AppCard key={e.id} app={e} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⚗</div>
            <div className={styles.emptyTitle}>EXPERIMENTS PENDING</div>
            <p className={styles.emptyText}>
              Something is being built. It just isn't ready to be seen yet.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

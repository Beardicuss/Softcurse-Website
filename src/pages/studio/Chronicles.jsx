import { Link } from 'react-router-dom'
import { getChronicles } from '../../data/chronicles'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import ChronicleCard from './ChronicleCard'
import styles from './Chronicles.module.css'

export default function Chronicles() {
  usePageTitle('Chronicles')
  useSEO({
    title: 'Chronicles',
    description: 'Softcurse Chronicles — a multi-POV narrative system and interactive visualization for books. Not just text. Worlds you can explore.',
    url: '/chronicles',
  })

  const [headerRef, headerVis] = useScrollReveal(0.05)
  const [gridRef,   gridVis]   = useScrollReveal()
  const books = getChronicles()

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={`page-header ${styles.pageHeader}`} ref={headerRef}>
        <div className={`${styles.headerInner} ${headerVis ? styles.visible : ''}`}>
          <div className={styles.breadcrumb}>
            <Link to="/studio" className={styles.breadcrumbLink}>STUDIO</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span>CHRONICLES</span>
          </div>
          <h1 className={styles.title}>
            SOFTCURSE <span className="text-magenta">CHRONICLES</span>
          </h1>
          <p className={styles.desc}>
            Not books. Worlds. Each Chronicle is a multi-POV narrative system —
            every character, every location, every event mapped and interconnected.
            Read linearly or explore the architecture behind the story.
          </p>

          {/* What is Chronicles */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>◈</div>
              <div className={styles.infoTitle}>MULTI-POV SYSTEM</div>
              <p className={styles.infoText}>
                Each story is written from multiple perspectives simultaneously.
                Switch between characters to see the same events through different eyes.
              </p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>◈</div>
              <div className={styles.infoTitle}>INTERACTIVE VISUALIZATION</div>
              <p className={styles.infoText}>
                Characters, locations, factions, and timelines rendered as a
                navigable knowledge graph. The world exists as data, not just prose.
              </p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>◈</div>
              <div className={styles.infoTitle}>NOT .DOCX OR .EPUB</div>
              <p className={styles.infoText}>
                Built as a custom reading and exploration environment.
                Structure and narrative are inseparable here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Books grid ── */}
      <div className="container" style={{ paddingBottom: '6rem' }}>
        {books.length > 0 ? (
          <div
            ref={gridRef}
            className={`reveal ${gridVis ? 'visible' : ''}`}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}
          >
            {books.map(b => <ChronicleCard key={b.id} book={b} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>◈</div>
            <div className={styles.emptyTitle}>CHRONICLES LOADING</div>
            <p className={styles.emptyText}>
              The first volume is being written. Check back soon.
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

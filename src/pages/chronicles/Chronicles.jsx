import { Link } from 'react-router-dom'
import { getBooks } from '../../data/chronicles'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import ChroniclesCard from '../../components/common/ChroniclesCard'
import styles from './Chronicles.module.css'

export default function Chronicles() {
  usePageTitle('Chronicles')
  useSEO({
    title: 'Chronicles',
    description: 'Softcurse Chronicles — a multi-POV narrative system and interactive visualization for books built in the dark.',
    url: '/chronicles',
  })

  const [headerRef, headerVis] = useScrollReveal(0.05)
  const [gridRef,   gridVis]   = useScrollReveal()

  const books = getBooks()

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <div className={`page-header ${styles.header}`} ref={headerRef}>
        <div className={`${styles.headerInner} reveal ${headerVis ? 'visible' : ''}`}>
          <div className="sec-header__label" style={{ color: 'var(--magenta)' }}>// SOFTCURSE CHRONICLES</div>
          <h1 className={styles.title}>
            CHRONICLES <span className={styles.accent}>SYSTEM</span>
          </h1>
          <p className={styles.desc}>
            Not just books. A multi-POV narrative system where every perspective reshapes
            what came before. Characters, timelines, and truths — visualized as a living web.
          </p>
          <div className={styles.pillRow}>
            <span className={styles.pill}>Multi-POV Architecture</span>
            <span className={styles.pill}>Interactive Timeline</span>
            <span className={styles.pill}>Character Web Visualization</span>
            <span className={styles.pill}>Thematic Thread Mapping</span>
          </div>
        </div>
      </div>

      {/* ── What is this ── */}
      <section className={`container ${styles.aboutSection}`}>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutBlock}>
            <div className={styles.aboutLabel}>// WHAT IS CHRONICLES</div>
            <h2 className={styles.aboutTitle}>A narrative OS, not a book format.</h2>
            <p className={styles.aboutText}>
              Chronicles is a submodule of Softcurse Studio built specifically for long-form fiction.
              Each book in the system exists as a structured data object — chapters, POV characters,
              timeline events, and thematic threads — not just text in a file.
            </p>
            <p className={styles.aboutText}>
              The reader experience surfaces these layers: switch between perspectives on the same
              event, trace a character arc across chapters, or explore how different narrators
              contradict each other. The story is the same. The truth depends on who you trust.
            </p>
          </div>
          <div className={styles.featureList}>
            {[
              ['◈', 'Multi-POV', 'Multiple unreliable narrators, same events — different truths.'],
              ['◈', 'Timeline Visualization', 'Interactive branching timeline across all POVs and chapters.'],
              ['◈', 'Character Web', 'Relationship map showing how characters connect, conflict, and evolve.'],
              ['◈', 'Thematic Threads', 'Track recurring motifs and themes woven across the full narrative.'],
              ['◈', 'Chapter Architecture', 'Structured chapter system with metadata — tone, POV, timeline position.'],
              ['◈', 'Same Universe', 'Set in the same world as Chronicles of a Fallen World — Studio game.'],
            ].map(([icon, title, body]) => (
              <div key={title} className={styles.featureItem}>
                <span className={styles.featureIcon}>{icon}</span>
                <div>
                  <div className={styles.featureTitle}>{title}</div>
                  <div className={styles.featureBody}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Books grid ── */}
      <section className={`container ${styles.gridSection}`}>
        <div className={styles.gridHeader}>
          <div className={styles.gridLabel}>// THE LIBRARY</div>
          <h2 className={styles.gridTitle}>Works in the system</h2>
        </div>
        <div
          ref={gridRef}
          className={`${styles.grid} reveal-group ${gridVis ? 'visible' : ''}`}
        >
          {books.map(b => <ChroniclesCard key={b.id} book={b} />)}
        </div>
      </section>

    </div>
  )
}

import { useParams, Link, Navigate } from 'react-router-dom'
import { CHRONICLES } from '../../data/chronicles'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import styles from './ChronicleDetail.module.css'

export default function ChronicleDetail() {
  const { id } = useParams()
  const book = CHRONICLES[id]
  if (!book) return <Navigate to="/chronicles" replace />

  usePageTitle(book.name)
  useSEO({
    title: book.name,
    description: book.shortDesc,
    url: `/chronicles/${book.id}`,
    image: book.image || undefined,
  })

  const [heroRef, heroVis] = useScrollReveal(0.05)
  const [chRef,   chVis]   = useScrollReveal()

  return (
    <div className={styles.page}>

      {/* ── Hero banner ── */}
      <div className={styles.hero} ref={heroRef}>
        {book.image
          ? <img src={book.image} alt="" className={styles.heroImg} loading="lazy" decoding="async" />
          : <div className={styles.heroPlaceholder}><span>◈</span></div>
        }
        <div className={styles.heroOverlay} />
        <div className={`${styles.heroContent} ${heroVis ? styles.heroVisible : ''}`}>
          <div className={styles.heroBadges}>
            <span className={styles.heroBadge}>{book.status === 'dev' ? '◎ IN DEV' : '● PUBLISHED'}</span>
            <span className={styles.heroBadge}>{book.genre}</span>
            <span className={styles.heroBadge}>{book.series}</span>
          </div>
          <div className={styles.heroBookLabel}>{book.book}</div>
          <h1 className={styles.heroTitle}>{book.name}</h1>
          <p className={styles.heroDesc}>{book.shortDesc}</p>
          <Link to="/chronicles" className={styles.heroBack}>← BACK TO CHRONICLES</Link>
        </div>
      </div>

      <div className="container--narrow">

        {/* ── Description ── */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>// ABOUT THIS VOLUME</div>
          <p className={styles.desc}>{book.desc}</p>
        </section>

        {/* ── Chapter list ── */}
        <section className={`${styles.section} reveal ${chVis ? 'visible' : ''}`} ref={chRef}>
          <div className={styles.sectionLabel}>// CHAPTERS</div>
          <h2 className={styles.sectionTitle}>{book.series}: {book.name}</h2>
          <div className={styles.chapterList}>
            {book.chapters.map(ch => (
              <Link
                key={ch.num}
                to={`/chronicles/${book.id}/chapter/${ch.num}`}
                className={`${styles.chapterRow} ${ch.status !== 'published' ? styles.chapterLocked : ''}`}
              >
                <div className={styles.chNum}>
                  {String(ch.num).padStart(2, '0')}
                </div>
                <div className={styles.chBody}>
                  <div className={styles.chTitle}>{ch.title}</div>
                  <div className={styles.chPov}>POV: {ch.pov}</div>
                </div>
                <div className={styles.chStatus}>
                  {ch.status === 'published'
                    ? <span className={styles.published}>READ →</span>
                    : <span className={styles.locked}>LOCKED</span>
                  }
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

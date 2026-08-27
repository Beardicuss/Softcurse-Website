import { useParams, Link, Navigate } from 'react-router-dom'
import { CHRONICLES } from '../../data/chronicles'
import { useCmsItems } from '../../content/CmsContent'
import { useSEO } from '../../hooks/useSEO'
import styles from './ChapterViewer.module.css'

export default function ChapterViewer() {
  const { id, num } = useParams()
  const books = useCmsItems('chronicle', Object.values(CHRONICLES))
  const book = books.find(item => item.id === id)
  const chNum   = parseInt(num, 10)
  const chapter = book ? book.chapters.find(c => c.num === chNum) : null

  useSEO(chapter && book ? {
    title: `${chapter.title} — ${book.name}`,
    description: `Read chapter ${chNum} of ${book.name}: ${chapter.title}.`,
    url: `/chronicles/${id}/chapter/${chNum}`,
    type: 'article',
  } : { noindex: true })

  if (!book) return <Navigate to="/chronicles" replace />
  if (!chapter || chapter.status !== 'published') return <Navigate to={`/chronicles/${id}`} replace />

  const publishedChapters = book.chapters.filter(c => c.status === 'published')
  const chapterIndex = publishedChapters.findIndex(c => c.num === chNum)
  const prev = chapterIndex > 0 ? publishedChapters[chapterIndex - 1] : null
  const next = chapterIndex >= 0 ? publishedChapters[chapterIndex + 1] : null

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <Link to={`/chronicles/${id}`} className={styles.backLink}>
          ← {book.book}: {book.name}
        </Link>
        <div className={styles.chapterInfo}>
          {chapter.pov && <span className={styles.pov}>POV: {chapter.pov}</span>}
          <span className={styles.chapterNum}>CH. {String(chNum).padStart(2, '0')}</span>
          <span className={styles.chapterTitle}>{chapter.title}</span>
        </div>
        <div className={styles.nav}>
          {prev
            ? <Link to={`/chronicles/${id}/chapter/${prev.num}`} className={styles.navBtn}>← PREV</Link>
            : <span className={styles.navDisabled}>← PREV</span>
          }
          {next
            ? <Link to={`/chronicles/${id}/chapter/${next.num}`} className={styles.navBtn}>NEXT →</Link>
            : <span className={styles.navDisabled}>NEXT →</span>
          }
        </div>
      </div>

      {/* ── Chapter HTML embedded via iframe ── */}
      <iframe
        src={chapter.file}
        className={styles.frame}
        title={chapter.title}
        sandbox="allow-scripts"
      />

      {/* ── Bottom nav ── */}
      <div className={styles.bottomNav}>
        {prev
          ? <Link to={`/chronicles/${id}/chapter/${prev.num}`} className={styles.navBtnLarge}>← {prev.title}</Link>
          : <span />
        }
        <Link to={`/chronicles/${id}`} className={styles.tocLink}>TABLE OF CONTENTS</Link>
        {next
          ? <Link to={`/chronicles/${id}/chapter/${next.num}`} className={styles.navBtnLarge}>{next.title} →</Link>
          : <span />
        }
      </div>

    </div>
  )
}

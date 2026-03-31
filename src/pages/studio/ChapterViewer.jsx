import { useParams, Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CHRONICLES } from '../../data/chronicles'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from './ChapterViewer.module.css'

export default function ChapterViewer() {
  const { id, num } = useParams()
  const book = CHRONICLES[id]
  if (!book) return <Navigate to="/chronicles" replace />

  const chNum   = parseInt(num, 10)
  const chapter = book.chapters.find(c => c.num === chNum)
  if (!chapter || chapter.status !== 'published') return <Navigate to={`/chronicles/${id}`} replace />

  usePageTitle(`${chapter.title} — ${book.name}`)

  const prev = book.chapters.find(c => c.num === chNum - 1 && c.status === 'published')
  const next = book.chapters.find(c => c.num === chNum + 1 && c.status === 'published')

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <Link to={`/chronicles/${id}`} className={styles.backLink}>
          ← {book.book}: {book.name}
        </Link>
        <div className={styles.chapterInfo}>
          <span className={styles.pov}>POV: {chapter.pov}</span>
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
        sandbox="allow-scripts allow-same-origin"
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

import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'
import styles from './ChroniclesCard.module.css'

export default function ChroniclesCard({ book }) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = (e.clientX - left) / width  - 0.5
    const y = (e.clientY - top)  / height - 0.5
    card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateY(-6px) scale(1.02)`
    card.style.boxShadow = `${-x * 16}px ${-y * 12}px 32px rgba(255,0,255,0.15), 0 0 24px rgba(255,0,255,0.1)`
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ''
    card.style.boxShadow = ''
  }

  return (
    <div
      className={styles.card}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {book.image && (
        <div className={styles.poster}>
          <img src={book.image} alt="" className={styles.posterImg} loading="lazy" decoding="async" />
        </div>
      )}
      <div className={styles.top}>
        <span className={styles.icon}>{book.icon}</span>
        <Badge status={book.status} />
      </div>
      <h3 className={styles.title}>{book.name}</h3>
      <p className={styles.desc}>{book.shortDesc}</p>
      <div className={styles.meta}>
        {book.povCount && <span className={styles.metaItem}>{book.povCount} POVs</span>}
        {book.chapters && <span className={styles.metaItem}>{book.chapters} chapters</span>}
        {book.wordCount && <span className={styles.metaItem}>{book.wordCount} words</span>}
      </div>
      <span className={styles.tag}>{book.genre}</span>
    </div>
  )
}

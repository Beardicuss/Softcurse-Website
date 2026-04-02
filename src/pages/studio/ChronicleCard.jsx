import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/common/Badge'
import styles from '../../components/common/GameCard.module.css'

export default function ChronicleCard({ book }) {
  const wrapRef = useRef(null)

  const handleMouseMove = (e) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const { left, top, width } = wrap.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    wrap.style.setProperty('--tilt-x', `${x * 6}deg`)
  }

  const handleMouseLeave = () => {
    const wrap = wrapRef.current
    if (wrap) wrap.style.setProperty('--tilt-x', '0deg')
  }

  return (
    <div className={styles.scene}>
      <Link
        to={`/chronicles/${book.id}`}
        className={`${styles.wrapper} ${styles.wrapperPortrait}`}
        ref={wrapRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label={book.name}
      >
        <div className={styles.card}>
          {book.image
            ? <img src={book.image} alt="" className={styles.coverImg} loading="lazy" decoding="async" />
            : <div className={styles.coverPlaceholder}><span>{book.icon || '◈'}</span></div>
          }
          <div className={styles.overlay} />

          <span className={`${styles.corner} ${styles.tl}`} />
          <span className={`${styles.corner} ${styles.tr}`} />
          <span className={`${styles.corner} ${styles.bl}`} />
          <span className={`${styles.corner} ${styles.br}`} />

          <div className={styles.badges}>
            <Badge status={book.status} />
            <span className={styles.tag}>{book.tag}</span>
          </div>

          <div className={styles.textRest}>
            <div className={styles.restLine} />
            <div className={styles.restTitle}>{book.name}</div>
            <div className={styles.restSub}>{book.series} · {book.book}</div>
          </div>
        </div>

        {book.character && (
          <>
            <div className={styles.charGlow} />
            <img
              src={book.character}
              alt=""
              className={styles.character}
              style={book.charSize ? { width: book.charSize.w, height: book.charSize.h } : {}}
              loading="lazy"
              decoding="async"
              aria-hidden="true"
            />
          </>
        )}

        {book.characterName && (
          <div className={styles.textHover}>
            <div className={styles.hoverName}>{book.characterName}</div>
            <div className={styles.hoverLine} />
          </div>
        )}
      </Link>
    </div>
  )
}

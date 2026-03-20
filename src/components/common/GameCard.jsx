import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'
import styles from './GameCard.module.css'

export default function GameCard({ game }) {
  const wrapRef = useRef(null)

  const handleMouseMove = (e) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const { left, top, width } = wrap.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    // Gentle lateral tilt only (the rotateX is CSS-driven on hover)
    wrap.style.setProperty('--tilt-x', `${x * 6}deg`)
  }

  const handleMouseLeave = () => {
    const wrap = wrapRef.current
    if (wrap) wrap.style.setProperty('--tilt-x', '0deg')
  }

  return (
    <div className={styles.scene}>
      <Link
        to={`/studio/${game.id}`}
        className={styles.wrapper}
        ref={wrapRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label={game.name}
      >
        {/* ── Card face ── */}
        <div className={styles.card}>
          {game.image
            ? <img src={game.image} alt="" className={styles.coverImg} loading="lazy" decoding="async" />
            : <div className={styles.coverPlaceholder}><span>{game.icon}</span></div>
          }
          <div className={styles.overlay} />

          {/* Corner decorations */}
          <span className={`${styles.corner} ${styles.tl}`} />
          <span className={`${styles.corner} ${styles.tr}`} />
          <span className={`${styles.corner} ${styles.bl}`} />
          <span className={`${styles.corner} ${styles.br}`} />

          {/* Badges top-left */}
          <div className={styles.badges}>
            <Badge status={game.status} />
            <span className={styles.tag}>{game.tag}</span>
          </div>

          {/* Resting text — fades on hover */}
          <div className={styles.textRest}>
            <div className={styles.restLine} />
            <div className={styles.restTitle}>{game.name}</div>
            <div className={styles.restSub}>{game.genre} · {game.platforms?.[0]}</div>
          </div>
        </div>

        {/* ── Character hologram ── */}
        {game.character && (
          <>
            <div className={styles.charGlow} />
            <img
              src={game.character}
              alt=""
              className={styles.character}
              style={game.charSize ? { width: game.charSize.w, height: game.charSize.h } : {}}
              loading="lazy"
              decoding="async"
              aria-hidden="true"
            />
          </>
        )}

        {/* ── Hover title ── */}
        {game.characterName && (
          <div className={styles.textHover}>
            <div className={styles.hoverName}>{game.characterName}</div>
            <div className={styles.hoverLine} />
          </div>
        )}

      </Link>
    </div>
  )
}

import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'
import styles from './GameCard.module.css'

export default function GameCard({ game }) {
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
    <Link
      to={`/studio/${game.id}`}
      className={styles.card}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {game.image && (
        <div className={styles.poster}>
          <img src={game.image} alt={game.name} className={styles.posterImg} />
        </div>
      )}
      <div className={styles.top}>
        <span className={styles.icon}>{game.icon}</span>
        <Badge status={game.status} />
      </div>
      <h3 className={styles.title}>{game.name}</h3>
      <p className={styles.desc}>{game.shortDesc}</p>
      <span className={styles.tag}>{game.tag}</span>
    </Link>
  )
}

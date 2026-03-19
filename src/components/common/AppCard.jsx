import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'
import styles from './AppCard.module.css'

export default function AppCard({ app }) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = (e.clientX - left) / width  - 0.5   // -0.5 to 0.5
    const y = (e.clientY - top)  / height - 0.5
    card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateY(-6px) scale(1.02)`
    card.style.boxShadow = `${-x * 16}px ${-y * 12}px 32px rgba(0,255,255,0.15), 0 0 24px rgba(0,255,255,0.1)`
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ''
    card.style.boxShadow = ''
  }

  return (
    <Link
      to={`/lab/${app.id}`}
      className={styles.card}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {app.image && (
        <div className={styles.poster}>
          <img src={app.image} alt={app.name} className={styles.posterImg} loading="lazy" decoding="async" />
        </div>
      )}
      <div className={styles.top}>
        <span className={styles.icon}>{app.icon}</span>
        <Badge status={app.status} />
      </div>
      <h3 className={styles.title}>{app.name}</h3>
      <p className={styles.desc}>{app.shortDesc}</p>
      <span className={styles.tag}>{app.tag}</span>
    </Link>
  )
}

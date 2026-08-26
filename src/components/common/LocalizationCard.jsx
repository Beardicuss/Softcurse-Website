import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Badge from './Badge'
import styles from './LocalizationCard.module.css'

export default function LocalizationCard({ project }) {
  const cardRef = useRef(null)

  const handleMouseMove = (event) => {
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = (event.clientX - left) / width - 0.5
    const y = (event.clientY - top) / height - 0.5
    card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateY(-5px)`
  }

  const resetTransform = () => {
    if (cardRef.current) cardRef.current.style.transform = ''
  }

  return (
    <Link
      to={`/localization/${project.id}`}
      className={styles.card}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTransform}
    >
      <div className={styles.poster}>
        <img src={project.image} alt="" className={styles.posterImg} loading="lazy" decoding="async" />
      </div>
      <div className={styles.top}>
        <span className={styles.icon} aria-hidden="true">{project.icon}</span>
        <Badge status={project.status} />
      </div>
      <h2 className={styles.title}>{project.name}</h2>
      <p className={styles.desc}>{project.shortDesc}</p>
      <div className={styles.bottom}>
        <span className={styles.tag}>{project.tag}</span>
        <span className={styles.progress}>{project.progress}</span>
      </div>
    </Link>
  )
}

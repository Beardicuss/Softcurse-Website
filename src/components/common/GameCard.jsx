import { Link } from 'react-router-dom'
import Badge from './Badge'
import styles from './GameCard.module.css'

/**
 * Card for Studio games. Links to /studio/:id
 */
export default function GameCard({ game }) {
  return (
    <Link to={`/studio/${game.id}`} className={styles.card}>
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

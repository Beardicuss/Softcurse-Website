import { Link } from 'react-router-dom'
import Badge from './Badge'
import styles from './AppCard.module.css'

/**
 * Card for Lab tools. Links to /lab/:id
 */
export default function AppCard({ app }) {
  return (
    <Link to={`/lab/${app.id}`} className={styles.card}>
      {app.image && (
        <div className={styles.poster}>
          <img src={app.image} alt={app.name} className={styles.posterImg} />
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

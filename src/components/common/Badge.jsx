import styles from './Badge.module.css'

/**
 * Status badge for apps and games.
 * @param {'active'|'beta'|'alpha'|'dev'|'planned'} status
 */
export default function Badge({ status }) {
  const map = {
    active: { label: '● LIVE', cls: styles.active },
    beta: { label: '⬡ BETA', cls: styles.beta },
    alpha: { label: '△ EARLY ALPHA', cls: styles.alpha },
    dev: { label: '◎ IN DEV', cls: styles.dev },
    planned: { label: '○ PLANNED', cls: styles.planned },
  }
  const { label, cls } = map[status] || map.planned
  return <span className={`${styles.badge} ${cls}`}>{label}</span>
}

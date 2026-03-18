import { useLocation } from 'react-router-dom'
import styles from './PageTransition.module.css'

/**
 * Triggers CSS fade-in on every route change.
 * The outer wrapper is stable; the inner div gets a new key on each pathname,
 * which forces React to unmount+remount it — reliably firing the animation.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation()
  return (
    <div className={styles.outer}>
      <div key={pathname} className={styles.wrap}>
        {children}
      </div>
    </div>
  )
}

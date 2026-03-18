import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.code}>404</div>
        <div className={styles.label}>// SIGNAL LOST</div>
        <h1 className={styles.title}>PAGE NOT FOUND</h1>
        <p className={styles.desc}>
          The page you're looking for doesn't exist, has been moved,
          or was never meant to be found. Some things in the Softcurse
          universe are meant to stay dark.
        </p>
        <div className={styles.actions}>
          <Link to="/" className={styles.btnCyan}>← RETURN HOME</Link>
          <Link to="/lab" className={styles.btnOutline}>EXPLORE THE LAB</Link>
        </div>
        <div className={styles.glitch} aria-hidden="true">404</div>
      </div>
    </div>
  )
}

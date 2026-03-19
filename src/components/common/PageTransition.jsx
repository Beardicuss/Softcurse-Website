import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './PageTransition.module.css'

/**
 * Scanline wipe transition between pages.
 * Flash of scanlines → content fades in.
 */
export default function PageTransition({ children }) {
  const location = useLocation()
  const [phase, setPhase] = useState('idle') // idle | wipe | in

  useEffect(() => {
    setPhase('wipe')
    const t1 = setTimeout(() => setPhase('in'), 120)
    const t2 = setTimeout(() => setPhase('idle'), 520)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [location.pathname])

  return (
    <div className={`${styles.wrap} ${styles[phase]}`}>
      {phase === 'wipe' && <div className={styles.wipe} aria-hidden="true" />}
      {children}
    </div>
  )
}

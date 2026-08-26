import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './PageTransition.module.css'

/**
 * Scanline wipe transition between pages.
 * Flash of scanlines → content fades in.
 */
export default function PageTransition({ children }) {
  const location = useLocation()

  return <TransitionFrame key={location.pathname}>{children}</TransitionFrame>
}

function TransitionFrame({ children }) {
  const [phase, setPhase] = useState('wipe') // wipe | in | idle

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('in'), 120)
    const t2 = setTimeout(() => setPhase('idle'), 520)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className={`${styles.wrap} ${styles[phase]}`}>
      {phase === 'wipe' && <div className={styles.wipe} aria-hidden="true" />}
      {children}
    </div>
  )
}

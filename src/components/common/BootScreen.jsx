import { useState, useEffect } from 'react'
import styles from './BootScreen.module.css'

const LINES = [
  '> SOFTCURSE OS v2025.ALPHA',
  '> LOADING CORE MODULES........',
  '> INITIALIZING LAB SYSTEMS....',
  '> MOUNTING STUDIO ASSETS......',
  '> ESTABLISHING DARK PROTOCOLS.',
  '> ALL SYSTEMS OPERATIONAL.',
]

export default function BootScreen({ onComplete }) {
  const [lineIndex, setLineIndex] = useState(0)
  const [progress,  setProgress]  = useState(0)
  const [fading,    setFading]    = useState(false)

  useEffect(() => {
    // Advance lines
    if (lineIndex < LINES.length) {
      const t = setTimeout(() => setLineIndex(i => i + 1), 180)
      return () => clearTimeout(t)
    }
  }, [lineIndex])

  useEffect(() => {
    // Progress bar races to 100 over ~1.4s
    const start = performance.now()
    const dur   = 1400
    let raf
    const tick = (now) => {
      const p = Math.min((now - start) / dur * 100, 100)
      setProgress(p)
      if (p < 100) raf = requestAnimationFrame(tick)
      else {
        // Short pause, then fade out
        setTimeout(() => {
          setFading(true)
          setTimeout(onComplete, 600)
        }, 200)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onComplete])

  return (
    <div className={`${styles.screen} ${fading ? styles.fading : ''}`} aria-hidden="true">
      <div className={styles.inner}>

        {/* Logo */}
        <div className={styles.logo}>
          <img src="/logo.png" alt="" className={styles.logoImg} />
          <span className={styles.logoText}>SOFTCURSE</span>
        </div>

        {/* Terminal lines */}
        <div className={styles.terminal}>
          {LINES.slice(0, lineIndex).map((line, i) => (
            <div key={i} className={styles.line}>{line}</div>
          ))}
          {lineIndex < LINES.length && (
            <div className={styles.line}>
              {LINES[lineIndex]}<span className={styles.cursor}>█</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className={styles.barWrap}>
          <div className={styles.barLabel}>
            <span>SYSTEM INIT</span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${progress}%` }} />
            <div className={styles.barGlow}  style={{ left: `${progress}%` }} />
          </div>
        </div>

        {/* Status */}
        <div className={styles.status}>
          <span className={styles.statusDot} />
          {progress < 100 ? 'INITIALIZING...' : 'READY'}
        </div>

      </div>

      {/* Scanline */}
      <div className={styles.scanline} />
    </div>
  )
}

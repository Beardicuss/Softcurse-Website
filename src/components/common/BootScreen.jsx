import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './BootScreen.module.css'

const TEXT_AUTO_S  = 16      // text appears at this second if no click
const VIDEO_END_S  = 18      // expected video duration
const PORTAL_MS    = 1400    // portal transition duration

export default function BootScreen({ onComplete }) {
  const videoRef     = useRef(null)
  const overlayRef   = useRef(null)
  const [showText,   setShowText]   = useState(false)
  const [showHint,   setShowHint]   = useState(false)
  const [phase, setPhase]           = useState('playing') // playing | text | portal | done
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  // Show text (triggered by click or timer)
  const triggerText = useCallback(() => {
    setShowText(true)
    setPhase('text')
  }, [])

  // After video ends → portal transition → reveal site
  const triggerPortal = useCallback(() => {
    if (phase === 'portal' || phase === 'done') return
    setPhase('portal')
    setTimeout(() => {
      setPhase('done')
      onComplete()
    }, PORTAL_MS)
  }, [phase, onComplete])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Auto-show text at second 16
    let textTimer = null
    const onTimeUpdate = () => {
      if (!showText && video.currentTime >= TEXT_AUTO_S) {
        triggerText()
      }
    }

    // Video ended → portal
    const onEnded = () => triggerPortal()

    // Fallback: if video never fires ended (e.g. loops off)
    let endFallback = setTimeout(triggerPortal, (VIDEO_END_S + 1) * 1000)

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)

    video.play().catch(() => {
      // Autoplay blocked — show text immediately, portal after VIDEO_END_S
      triggerText()
    })

    // Show tap hint after 1.5s on mobile
    const hintTimer = setTimeout(() => setShowHint(true), 1500)
    return () => clearTimeout(hintTimer)

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
      clearTimeout(textTimer)
      clearTimeout(endFallback)
    }
  }, [triggerText, triggerPortal, showText])

  // Click anywhere → show text → 2s later → portal
  const handleClick = () => {
    if (!showText) {
      triggerText()
      setTimeout(() => triggerPortal(), 2000)
    }
  }

  return (
    <div
      className={`${styles.screen} ${phase === 'portal' ? styles.portal : ''} ${phase === 'done' ? styles.done : ''}`}
      onClick={handleClick}
      aria-hidden="true"
    >
      {/* Full-screen video */}
      <video
        ref={videoRef}
        className={styles.video}
        src="/video/intro.mp4"
        muted
        playsInline
        preload="auto"
      />

      {/* Dark overlay — lightens slightly when text appears */}
      <div className={`${styles.overlay} ${showText ? styles.overlayText : ''}`} />

      {/* Tap hint — mobile only, disappears on tap */}
      {showHint && !showText && (
        <div className={styles.tapHint}>TAP ANYWHERE TO SKIP</div>
      )}

      {/* Text reveal */}
      {showText && (
        <div className={styles.textBlock}>
          <div className={styles.textInner}>
            <h1 className={styles.title}>SOFTCURSE SYSTEMS</h1>
            <p  className={styles.subtitle}>A small, slightly sinister digital universe.</p>
          </div>
        </div>
      )}

    </div>
  )
}

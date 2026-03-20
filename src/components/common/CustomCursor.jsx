import { useEffect, useRef } from 'react'
import styles from './CustomCursor.module.css'

/**
 * Custom cyan crosshair cursor.
 * Hidden on touch devices. Degrades gracefully if JS fails.
 */
export default function CustomCursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return

    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mx = -100, my = -100
    let dx = -100, dy = -100   // dot lerp
    let rx = -100, ry = -100   // ring lerp
    let raf

    document.body.style.cursor = 'none'

    const onMove = (e) => { mx = e.clientX; my = e.clientY }

    const tick = () => {
      // Both lerp at the same speed — dot slightly faster so they feel unified
      dx += (mx - dx) * 0.55
      dy += (my - dy) * 0.55
      rx += (mx - rx) * 0.45
      ry += (my - ry) * 0.45
      dot.style.transform  = `translate(${dx}px, ${dy}px)`
      ring.style.transform = `translate(${rx}px, ${ry}px)`
      raf = requestAnimationFrame(tick)
    }

    const onEnter = () => ring.classList.add(styles.large)
    const onLeave = () => ring.classList.remove(styles.large)
    const onDown  = () => dot.classList.add(styles.pressed)
    const onUp    = () => dot.classList.remove(styles.pressed)

    const attachHover = () => {
      document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        if (el._cursorBound) return
        el._cursorBound = true
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup',   onUp)
    attachHover()

    // Re-attach on DOM changes (React renders new links)
    const mo = new MutationObserver(attachHover)
    mo.observe(document.body, { childList: true, subtree: true })

    raf = requestAnimationFrame(tick)

    return () => {
      document.body.style.cursor = ''
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup',   onUp)
      mo.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className={styles.dot}  aria-hidden="true" />
      <div ref={ringRef} className={styles.ring} aria-hidden="true" />
    </>
  )
}

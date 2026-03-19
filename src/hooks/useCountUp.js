import { useState, useEffect, useRef } from 'react'

/**
 * Counts a number from 0 to target when triggered.
 * Handles non-numeric values (∞, ?) by returning them as-is.
 * @param {string|number} target  - final value
 * @param {boolean}        run     - start counting when true
 * @param {number}         duration - ms
 */
export function useCountUp(target, run, duration = 1400) {
  const [value, setValue] = useState('0')
  const rafRef = useRef(null)

  useEffect(() => {
    if (!run) return
    const num = parseInt(target, 10)
    if (isNaN(num)) { setValue(String(target)); return }

    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(String(Math.floor(ease * num)))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else setValue(String(num))
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [run, target, duration])

  return value
}

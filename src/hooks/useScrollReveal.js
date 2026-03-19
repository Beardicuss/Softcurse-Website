import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref and whether the element is visible in the viewport.
 * Once visible, stays visible (one-shot reveal).
 * @param {number} threshold - 0–1, how much of the element must be visible
 * @param {string} rootMargin - IntersectionObserver rootMargin
 */
export function useScrollReveal(threshold = 0.12, rootMargin = '0px 0px -40px 0px') {
  const ref     = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { setVisible(true); return }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold, rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, visible]
}

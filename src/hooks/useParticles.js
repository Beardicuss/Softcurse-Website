import { useEffect, useRef } from 'react'

export function useParticles(active = true) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)

  useEffect(() => {
    if (!active) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const COLORS = ['#00FFFF', '#FF00FF']
    let particles = []
    let config = {}

    // ── Responsive config based on canvas width ──
    const getConfig = (w) => {
      if (w < 600) {
        // Mobile — fewer, smaller, shorter links
        return { COUNT: 35, LINK: 80, minR: 0.8, maxR: 1.6, minA: 0.25, maxA: 0.55, lineW: 0.5, lineAlpha: 0.2 }
      } else if (w < 1024) {
        // Tablet
        return { COUNT: 55, LINK: 100, minR: 1.0, maxR: 2.0, minA: 0.28, maxA: 0.60, lineW: 0.6, lineAlpha: 0.25 }
      } else {
        // Desktop
        return { COUNT: 80, LINK: 130, minR: 1.0, maxR: 3.0, minA: 0.3,  maxA: 0.8,  lineW: 0.8, lineAlpha: 0.35 }
      }
    }

    const init = () => {
      const { width, height } = canvas
      if (!width || !height) return
      config = getConfig(width)
      const { COUNT, minR, maxR, minA, maxA } = config
      particles = Array.from({ length: COUNT }, () => ({
        x:   Math.random() * width,
        y:   Math.random() * height,
        vx:  (Math.random() - 0.5) * 0.45,
        vy:  (Math.random() - 0.5) * 0.45,
        r:   Math.random() * (maxR - minR) + minR,
        col: COLORS[Math.floor(Math.random() * COLORS.length)],
        a:   Math.random() * (maxA - minA) + minA,
      }))
    }

    const setSize = (w, h) => {
      if (!w || !h) return
      canvas.width  = w
      canvas.height = h
      init()
    }

    const draw = () => {
      const { width, height } = canvas
      if (!width || !height) { animRef.current = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, width, height)

      const LINK_SQ = config.LINK * config.LINK
      // Detect light theme — use darker line color so connections are visible
      const isLight = document.documentElement.getAttribute('data-theme') === 'light'
      const lineColor = isLight ? '#0055AA' : '#00FFFF'
      const alphaBoost = isLight ? 2.5 : 1   // boost opacity on light bg

      // Connections
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j]
          const dx = pi.x - pj.x
          const dy = pi.y - pj.y
          const dSq = dx * dx + dy * dy
          if (dSq < LINK_SQ) {
            const ratio = 1 - dSq / LINK_SQ
            ctx.globalAlpha = Math.min(1, ratio * config.lineAlpha * alphaBoost)
            ctx.strokeStyle = lineColor
            ctx.lineWidth   = config.lineW
            ctx.beginPath()
            ctx.moveTo(pi.x, pi.y)
            ctx.lineTo(pj.x, pj.y)
            ctx.stroke()
          }
        }
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = width
        if (p.x > width)  p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx.globalAlpha = isLight ? Math.min(1, p.a * 1.8) : p.a
        ctx.fillStyle   = p.col
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(draw)
    }

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize(Math.floor(width), Math.floor(height))
      }
    })
    ro.observe(canvas)

    requestAnimationFrame(() => {
      if (!canvas.width || !canvas.height) {
        setSize(canvas.offsetWidth, canvas.offsetHeight)
      }
    })

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [active])

  return canvasRef
}

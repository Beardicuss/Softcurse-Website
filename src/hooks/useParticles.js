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

    const COLORS  = ['#00FFFF', '#FF00FF']
    const COUNT   = 80         // more particles
    const LINK    = 130        // longer connection distance
    const LINK_SQ = LINK * LINK

    let particles = []

    const init = () => {
      const { width, height } = canvas
      if (!width || !height) return  // guard against 0-size canvas
      particles = Array.from({ length: COUNT }, () => ({
        x:   Math.random() * width,
        y:   Math.random() * height,
        vx:  (Math.random() - 0.5) * 0.45,
        vy:  (Math.random() - 0.5) * 0.45,
        r:   Math.random() * 2 + 1,           // bigger: 1–3px radius
        col: COLORS[Math.floor(Math.random() * COLORS.length)],
        a:   Math.random() * 0.5 + 0.3,       // more opaque: 0.3–0.8
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
      if (!width || !height) {
        animRef.current = requestAnimationFrame(draw)
        return
      }
      ctx.clearRect(0, 0, width, height)

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
            ctx.globalAlpha = ratio * 0.35   // much more visible connections
            ctx.strokeStyle = '#00FFFF'
            ctx.lineWidth   = 0.8
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

        ctx.globalAlpha = p.a
        ctx.fillStyle   = p.col
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(draw)
    }

    // ResizeObserver — fires immediately on observe
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize(Math.floor(width), Math.floor(height))
      }
    })
    ro.observe(canvas)

    // Fallback: if ResizeObserver fired with 0 dims (canvas not painted yet),
    // retry after a frame using actual offsetWidth/Height
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

import { useEffect } from 'react'

/**
 * Animated PNG cursor using frames from /cursor/01.png – 06.png
 * Applied globally to ALL cursor types via CSS cursor property.
 * Touch devices: skipped.
 */
export default function CustomCursor() {
  useEffect(() => {
    // Skip touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return

    const FRAMES = 11
    const FPS    = 12          // animation speed — change to taste
    const SIZE   = 32          // cursor hotspot size in CSS pixels
    const HOT_X  = 4           // hotspot X (tip of cursor)
    const HOT_Y  = 4           // hotspot Y (tip of cursor)

    // Pre-load all frames as Image objects
    const images = Array.from({ length: FRAMES }, (_, i) => {
      const img = new Image()
      img.src = `/cursor/${String(i + 1).padStart(2, '0')}.png`
      return img
    })

    // We draw each frame onto an offscreen canvas, export as data URL,
    // then inject into a <style> tag to swap cursor every frame.
    const canvas = document.createElement('canvas')
    canvas.width  = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')

    let frame    = 0
    let styleTag = document.getElementById('sc-cursor-style')
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'sc-cursor-style'
      document.head.appendChild(styleTag)
    }

    // Wait for all images to load then start animation
    let loaded = 0
    const onLoad = () => {
      loaded++
      if (loaded < FRAMES) return
      startLoop()
    }
    images.forEach(img => {
      if (img.complete) onLoad()
      else img.onload = onLoad
    })

    let intervalId = null

    const startLoop = () => {
      const tick = () => {
        const img = images[frame % FRAMES]
        ctx.clearRect(0, 0, SIZE, SIZE)
        ctx.drawImage(img, 0, 0, SIZE, SIZE)
        const dataUrl = canvas.toDataURL('image/png')
        // Apply to ALL cursor types so nothing falls back to default arrow
        styleTag.textContent = `
          *, *::before, *::after {
            cursor: url("${dataUrl}") ${HOT_X} ${HOT_Y}, auto !important;
          }
        `
        frame = (frame + 1) % FRAMES
      }
      tick() // draw immediately
      intervalId = setInterval(tick, 1000 / FPS)
    }

    return () => {
      clearInterval(intervalId)
      if (styleTag) styleTag.textContent = ''
    }
  }, [])

  return null
}

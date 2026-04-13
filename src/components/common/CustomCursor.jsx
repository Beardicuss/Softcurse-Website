import { useEffect } from 'react'

/**
 * Animated PNG cursor:
 * - Default/all:  /cursor/01.png – 11.png  @ 12 FPS
 * - Text/select:  /cursor/txt/frame_0001.png – frame_0015.png  @ 12 FPS
 */
export default function CustomCursor() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const FPS    = 12
    const SIZE   = 32
    const HOT_X  = 4
    const HOT_Y  = 4

    // Default cursor frames
    const DEF_FRAMES = 11
    const defImages = Array.from({ length: DEF_FRAMES }, (_, i) => {
      const img = new Image()
      img.src = `/cursor/${String(i + 1).padStart(2, '0')}.png`
      return img
    })

    // Text cursor frames
    const TXT_FRAMES = 15
    const txtImages = Array.from({ length: TXT_FRAMES }, (_, i) => {
      const img = new Image()
      img.src = `/cursor/txt/frame_${String(i + 1).padStart(4, '0')}.png`
      return img
    })

    const canvas = document.createElement('canvas')
    canvas.width = SIZE; canvas.height = SIZE
    const ctx = canvas.getContext('2d')

    let styleTag = document.getElementById('sc-cursor-style')
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'sc-cursor-style'
      document.head.appendChild(styleTag)
    }

    let defFrame = 0
    let txtFrame = 0
    let intervalId = null

    // Wait for all images
    const allImages = [...defImages, ...txtImages]
    let loaded = 0
    const onLoad = () => { loaded++; if (loaded >= allImages.length) startLoop() }
    allImages.forEach(img => { if (img.complete) onLoad(); else img.onload = onLoad })

    const toDataUrl = (img) => {
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      return canvas.toDataURL('image/png')
    }

    const startLoop = () => {
      const tick = () => {
        const defUrl = toDataUrl(defImages[defFrame % DEF_FRAMES])
        const txtUrl = toDataUrl(txtImages[txtFrame % TXT_FRAMES])
        defFrame = (defFrame + 1) % DEF_FRAMES
        txtFrame = (txtFrame + 1) % TXT_FRAMES

        styleTag.textContent = `
          *, *::before, *::after {
            cursor: url("${defUrl}") ${HOT_X} ${HOT_Y}, auto !important;
          }
          input, textarea, [contenteditable],
          p, span, h1, h2, h3, h4, h5, h6,
          .chTitle, .chDesc, .desc, .heroTitle, .heroDesc,
          [class*="title"], [class*="desc"], [class*="text"], [class*="body"] {
            cursor: url("${txtUrl}") ${HOT_X} ${HOT_Y}, text !important;
          }
          ::selection {
            background: rgba(0,255,255,0.25);
          }
        `
      }
      tick()
      intervalId = setInterval(tick, 1000 / FPS)
    }

    return () => {
      clearInterval(intervalId)
      if (styleTag) styleTag.textContent = ''
    }
  }, [])

  return null
}

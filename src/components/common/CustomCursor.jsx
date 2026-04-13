import { useEffect } from 'react'

/**
 * Animated PNG cursor.
 * - Default: /cursor/01.png – 11.png
 * - Text:    /cursor/txt/frame_0001.png – frame_0015.png
 *
 * Performance: data URLs are baked ONCE on load.
 * The style tag only updates when the frame index changes (~12fps).
 * No toDataURL() calls during animation — just array reads.
 */
export default function CustomCursor() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const FPS       = 12
    const SIZE      = 32
    const HOT_X     = 4
    const HOT_Y     = 4
    const DEF_COUNT = 11
    const TXT_COUNT = 15

    // Offscreen canvas used only during pre-bake
    const canvas = document.createElement('canvas')
    canvas.width = SIZE; canvas.height = SIZE
    const ctx2 = canvas.getContext('2d')

    const bake = (img) => {
      ctx2.clearRect(0, 0, SIZE, SIZE)
      ctx2.drawImage(img, 0, 0, SIZE, SIZE)
      return canvas.toDataURL('image/png')
    }

    // Style tag — created once, updated in place
    let styleTag = document.getElementById('sc-cursor-style')
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'sc-cursor-style'
      document.head.appendChild(styleTag)
    }

    let defUrls = []
    let txtUrls = []
    let defFrame = 0
    let txtFrame = 0
    let intervalId = null
    let totalLoaded = 0
    const totalNeeded = DEF_COUNT + TXT_COUNT

    const onAllLoaded = () => {
      // Apply initial cursor immediately so there's no flash
      updateStyle()
      intervalId = setInterval(() => {
        defFrame = (defFrame + 1) % DEF_COUNT
        txtFrame = (txtFrame + 1) % TXT_COUNT
        updateStyle()
      }, 1000 / FPS)
    }

    const updateStyle = () => {
      if (!defUrls[defFrame] || !txtUrls[txtFrame]) return
      styleTag.textContent = `
        *, *::before, *::after {
          cursor: url("${defUrls[defFrame]}") ${HOT_X} ${HOT_Y}, auto !important;
        }
        input, textarea, [contenteditable],
        p, span, li, a,
        h1, h2, h3, h4, h5, h6 {
          cursor: url("${txtUrls[txtFrame]}") ${HOT_X} ${HOT_Y}, text !important;
        }
        ::selection { background: rgba(0,255,255,0.22); }
      `
    }

    const loadImage = (src, onDone) => {
      const img = new Image()
      img.onload = () => { onDone(img); totalLoaded++; if (totalLoaded >= totalNeeded) onAllLoaded() }
      img.onerror = () => { totalLoaded++; if (totalLoaded >= totalNeeded) onAllLoaded() }
      img.src = src
    }

    // Load default frames
    for (let i = 0; i < DEF_COUNT; i++) {
      const idx = i
      loadImage(`/cursor/${String(i + 1).padStart(2, '0')}.png`, (img) => {
        defUrls[idx] = bake(img)
      })
    }

    // Load text frames
    for (let i = 0; i < TXT_COUNT; i++) {
      const idx = i
      loadImage(`/cursor/txt/frame_${String(i + 1).padStart(4, '0')}.png`, (img) => {
        txtUrls[idx] = bake(img)
      })
    }

    return () => {
      clearInterval(intervalId)
      if (styleTag) styleTag.textContent = ''
    }
  }, [])

  return null
}

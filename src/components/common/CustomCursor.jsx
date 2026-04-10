import { useEffect } from 'react'

/**
 * Ice Cyber-S cursor — triangle with animated S, antenna dots,
 * idle/move/click states. Touch devices: hidden.
 */
export default function CustomCursor() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    // Inject global cursor:none
    const style = document.createElement('style')
    style.id = 'cursor-hide'
    style.textContent = '*, *::before, *::after { cursor: none !important; }'
    document.head.appendChild(style)

    // Create DOM
    const wrap = document.createElement('div')
    wrap.id = 'sc-cursor'
    wrap.innerHTML = `
      <svg width="40" height="38" viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;filter:drop-shadow(0 0 4px #00c8e8) drop-shadow(0 0 12px rgba(0,200,232,0.33));transition:filter 0.1s ease">
        <defs>
          <filter id="sc-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.5" result="b1"/>
            <feGaussianBlur stdDeviation="4" result="b2"/>
            <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="sc-ice" x1="6" y1="5" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stop-color="#0d2e38" stop-opacity="0.72"/>
            <stop offset="45%"  stop-color="#071418" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#000a0d" stop-opacity="0.38"/>
          </linearGradient>
          <linearGradient id="sc-sheen" x1="6" y1="5" x2="35" y2="11" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stop-color="#a8f0f4" stop-opacity="0.18"/>
            <stop offset="40%"  stop-color="#00c8e8" stop-opacity="0.06"/>
            <stop offset="100%" stop-color="#00c8e8" stop-opacity="0"/>
          </linearGradient>
          <clipPath id="sc-clip"><polygon points="6,5 35,11 15,34"/></clipPath>
        </defs>
        <polygon points="6,5 35,11 15,34" fill="url(#sc-ice)" stroke="#00c8e8" stroke-width="1.4" stroke-linejoin="round" filter="url(#sc-glow)"/>
        <polygon points="6,5 35,11 15,34" fill="url(#sc-sheen)" stroke="none"/>
        <polygon points="8,7 32,13 17,31" fill="none" stroke="#00c8e8" stroke-width="0.5" stroke-linejoin="round" opacity="0.28"/>
        <line x1="8"  y1="7"  x2="3"  y2="2"  stroke="#00c8e8" stroke-width="1.2" stroke-linecap="round" filter="url(#sc-glow)"/>
        <line x1="11" y1="7"  x2="14" y2="1"  stroke="#00c8e8" stroke-width="1.2" stroke-linecap="round" filter="url(#sc-glow)"/>
        <line x1="6"  y1="8"  x2="12" y2="7"  stroke="#00c8e8" stroke-width="0.8" stroke-linecap="round" opacity="0.55"/>
        <circle cx="3"  cy="2" r="1" fill="#00c8e8" filter="url(#sc-glow)">
          <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite"/>
        </circle>
        <circle cx="14" cy="1" r="1" fill="#00c8e8" filter="url(#sc-glow)">
          <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" begin="0.5s" repeatCount="indefinite"/>
        </circle>
        <line x1="9"  y1="14" x2="6"  y2="16" stroke="#00c8e8" stroke-width="1" stroke-linecap="round" opacity="0.65"/>
        <line x1="11" y1="22" x2="8"  y2="23" stroke="#00c8e8" stroke-width="1" stroke-linecap="round" opacity="0.65"/>
        <line x1="21" y1="8"  x2="23" y2="11" stroke="#00c8e8" stroke-width="1" stroke-linecap="round" opacity="0.65"/>
        <line x1="29" y1="10" x2="30" y2="13" stroke="#00c8e8" stroke-width="1" stroke-linecap="round" opacity="0.65"/>
        <circle cx="6" cy="5" r="1.6" fill="#00e8ff" filter="url(#sc-glow)">
          <animate attributeName="r"       values="1.6;2.2;1.6" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.3;1"     dur="2s" repeatCount="indefinite"/>
        </circle>
        <text id="sc-s-idle"  x="18" y="17" text-anchor="middle" dominant-baseline="middle" font-family="Orbitron,monospace" font-size="10" font-weight="900" fill="#0d2a30"  transform="rotate(-45,18,17)" clip-path="url(#sc-clip)">S</text>
        <text id="sc-s-move"  x="18" y="17" text-anchor="middle" dominant-baseline="middle" font-family="Orbitron,monospace" font-size="10" font-weight="900" fill="#00e8ff" filter="url(#sc-glow)" transform="rotate(-45,18,17)" clip-path="url(#sc-clip)" style="opacity:0">S</text>
        <text id="sc-s-click" x="18" y="17" text-anchor="middle" dominant-baseline="middle" font-family="Orbitron,monospace" font-size="10" font-weight="900" fill="#39ff14" filter="url(#sc-glow)" transform="rotate(-45,18,17)" clip-path="url(#sc-clip)" style="opacity:0">S</text>
      </svg>
    `

    Object.assign(wrap.style, {
      position: 'fixed',
      top: '0', left: '0',
      pointerEvents: 'none',
      zIndex: '99999',
      willChange: 'left, top',
      transform: 'translate(-6px, -5px)',
    })

    document.body.appendChild(wrap)

    const svg    = wrap.querySelector('svg')
    const sIdle  = wrap.querySelector('#sc-s-idle')
    const sMove  = wrap.querySelector('#sc-s-move')
    const sClick = wrap.querySelector('#sc-s-click')

    let mx = 0, my = 0, cx = -100, cy = -100
    let moveTimer = null
    let state = 'idle' // idle | move | click

    const setState = (s) => {
      if (state === s) return
      state = s
      sIdle.style.opacity  = s === 'idle'  ? '1' : '0'
      sMove.style.opacity  = s === 'move'  ? '1' : '0'
      sClick.style.opacity = s === 'click' ? '1' : '0'
      svg.style.filter = s === 'click'
        ? 'drop-shadow(0 0 6px #39ff14) drop-shadow(0 0 18px rgba(57,255,20,0.4))'
        : 'drop-shadow(0 0 4px #00c8e8) drop-shadow(0 0 12px rgba(0,200,232,0.33))'
    }

    const tick = () => {
      cx += (mx - cx) * 0.65
      cy += (my - cy) * 0.65
      wrap.style.left = cx + 'px'
      wrap.style.top  = cy + 'px'
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      if (state !== 'click') setState('move')
      clearTimeout(moveTimer)
      moveTimer = setTimeout(() => { if (state !== 'click') setState('idle') }, 150)
    }

    const onDown = () => setState('click')
    const onUp   = () => setState('move')

    document.addEventListener('mousemove',  onMove)
    document.addEventListener('mousedown',  onDown)
    document.addEventListener('mouseup',    onUp)

    return () => {
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mousedown',  onDown)
      document.removeEventListener('mouseup',    onUp)
      wrap.remove()
      style.remove()
      document.body.style.cursor = ''
    }
  }, [])

  return null
}

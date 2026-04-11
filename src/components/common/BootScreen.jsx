import { useEffect, useRef, useState } from 'react'
import styles from './BootScreen.module.css'

// Total duration of the boot animation before fade-out begins (ms)
const ANIM_MS   = 5200
// How long the fade-out transition takes (ms)
const FADE_MS   = 900

export default function BootScreen({ onComplete }) {
  const canvasRef = useRef(null)
  const [fading,  setFading]  = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stop = runCity(canvas, ANIM_MS)

    // Kick off fade when animation window ends
    const fadeTimer = setTimeout(() => {
      setFading(true)
      setTimeout(onComplete, FADE_MS)
    }, ANIM_MS)

    return () => {
      stop()
      clearTimeout(fadeTimer)
      window.removeEventListener('resize', resize)
    }
  }, [onComplete])

  return (
    <div className={`${styles.screen} ${fading ? styles.fading : ''}`} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CITY ANIMATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function runCity(canvas, totalMs) {
  const ctx = canvas.getContext('2d')

  // Phase map: each phase occupies a slice of [0..1]
  const PH = {
    dormant : [0.00, 0.09],
    boot    : [0.09, 0.22],
    surge   : [0.22, 0.38],
    build   : [0.38, 0.68],
    alive   : [0.68, 0.84],
    reveal  : [0.84, 1.00],   // "SOFTCURSE SYSTEMS" fades in
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  const eOut  = (t, p=2) => 1 - Math.pow(1 - clamp(t,0,1), p)
  const eIn   = (t, p=2) => Math.pow(clamp(t,0,1), p)
  const lerp  = (a,b,t)  => a + (b-a) * clamp(t,0,1)
  const clamp = (v,a,b)  => Math.min(b, Math.max(a, v))
  const rng   = s => { let x = Math.sin(s+1.3)*93758.5453; return x - Math.floor(x) }

  const ph     = (n, r) => { const [s,e]=PH[n]; return clamp((r-s)/(e-s),0,1) }
  const active = (n, r) => { const [s,e]=PH[n]; return r>=s && r<e }

  const hexRgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]
  const rgba   = (col,a) => { const[r,g,b]=hexRgb(col); return `rgba(${r},${g},${b},${clamp(a,0,1)})` }

  const roundRect = (x,y,w,h,r) => {
    ctx.beginPath()
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y)
    ctx.closePath()
  }

  // ── geometry (computed each frame from canvas size) ───────────────────────
  const geo = () => {
    const W=canvas.width, H=canvas.height
    const CX=W/2, CY=H*0.44
    const CHIP_W = Math.min(W,H)*0.21
    const GROUND = CY + H*0.13
    return { W, H, CX, CY, CHIP_W, GROUND }
  }

  // ── static data ───────────────────────────────────────────────────────────
  const TCOLS = ['#00f5ff','#00f5ff','#00aaff','#7700ff','#00ffaa','#ff7700','#0055ff']

  // Traces generated relative to chip centre (will be scaled at draw time)
  const TRACES = Array.from({length:54}, (_,i) => {
    const ang = (i/54)*Math.PI*2
    const pts = [{x: rng(i)*60-30, y: rng(i*3)*60-30}]
    let cx=pts[0].x, cy=pts[0].y
    for (let s=0; s < 2+Math.floor(rng(i*7)*3); s++) {
      if (s%2===0) cx += Math.cos(ang)*(55+rng(i*s+1)*85)
      else         cy += Math.sin(ang)*(55+rng(i*s+1)*85)
      pts.push({x:cx, y:cy})
    }
    return { pts, col:TCOLS[i%TCOLS.length], delay:i/54, w:rng(i*11)*0.8+0.4 }
  })

  const BCOLS  = ['#00f5ff','#0077ff','#7700ff','#00ffaa','#ff7700','#00aaff']
  const BRAW   = [
    [-310,22,340],[-282,16,200],[-260,28,400],[-226,18,260],[-202,35,480],
    [-162,20,220],[-136,30,520],[-100,22,340],[-74,32,560],[-36,38,600],
    [-2,34,580],[36,30,520],[70,24,400],[98,28,320],[130,22,460],
    [158,20,260],[182,32,300],[218,20,240],[244,18,200],[268,26,340],
    [298,20,180],[324,18,140],[-338,18,160],[346,16,120],[-358,16,110],
    [366,14,90],[80,14,160],[-120,14,140],
  ]
  const BUILDINGS = BRAW.map((d,i) => {
    const [ox,w,h] = d, col = BCOLS[i%BCOLS.length]
    const wins = []
    for (let r=0; r<Math.ceil(h/20); r++)
      for (let c=0; c<Math.floor(w/9); c++)
        if (rng(i*r+c*3)>0.4) wins.push({r,c,b:rng(i+r*c)*0.8+0.2})
    return { ox, w, h, col, delay:0.12+Math.abs(ox)/700*0.72, wins,
             hasTip:rng(i*17)>0.5, tipH:20+rng(i)*55 }
  })

  // ── pulses ────────────────────────────────────────────────────────────────
  const PULSES = []
  const ptOn = (pts,t) => {
    const n=pts.length-1, si=Math.min(Math.floor(t*n),n-1), f=t*n-si
    return { x:lerp(pts[si].x,pts[si+1].x,f), y:lerp(pts[si].y,pts[si+1].y,f) }
  }
  const spawnPulse = (CX,CY) => {
    if (PULSES.length>60) return
    const tr = TRACES[Math.floor(Math.random()*TRACES.length)]
    PULSES.push({ tr, t:0, spd:0.007+Math.random()*0.017,
                  col:tr.col, r:1.5+Math.random()*2.5, tail:[], CX, CY })
  }

  // ── draw: background ─────────────────────────────────────────────────────
  const drawBg = (raw, {W,H,CX,GROUND}) => {
    ctx.fillStyle = '#000008'
    ctx.fillRect(0,0,W,H)
    const ca = clamp(ph('build',raw)*0.7 + ph('alive',raw)*0.5 + ph('reveal',raw)*0.3, 0, 1.2)
    if (ca > 0.01) {
      const g = ctx.createRadialGradient(CX,GROUND,0, CX,GROUND,W*0.7)
      g.addColorStop(0, `rgba(0,40,110,${ca*0.2})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H)
    }
  }

  // ── draw: stars ───────────────────────────────────────────────────────────
  const drawStars = (raw, {W,H}) => {
    const a = 1 - clamp(ph('boot',raw)*2,0,1)
    if (a < 0.01) return
    for (let i=0; i<130; i++) {
      ctx.beginPath()
      ctx.arc(rng(i*2.3)*W, rng(i*5.7)*H*0.42, 0.8, 0, Math.PI*2)
      ctx.fillStyle = `rgba(160,200,255,${a*(0.5+0.5*Math.sin(raw*12+i))*0.7})`
      ctx.fill()
    }
  }

  // ── draw: chip ────────────────────────────────────────────────────────────
  const drawChip = (raw, tick, {W,H,CX,CY,CHIP_W}) => {
    const hw = CHIP_W/2, hh = CHIP_W/2

    // alpha & glow power per phase
    let alpha, glow
    if      (active('dormant',raw)) { alpha = eOut(ph('dormant',raw))*0.6;  glow = ph('dormant',raw)*0.5 }
    else if (active('boot',raw))    { alpha = lerp(0.6,1,eOut(ph('boot',raw))); glow = eOut(ph('boot',raw))*1.4 }
    else if (active('reveal',raw))  { alpha = lerp(1,0.4,ph('reveal',raw)); glow = lerp(1.2,0.4,ph('reveal',raw)) }
    else                            { alpha = 1; glow = 1 + Math.sin(tick*0.9)*0.25 }
    if (alpha < 0.005) return

    ctx.save()
    const S = 1 + Math.sin(tick*1.1)*0.008
    ctx.translate(CX,CY); ctx.scale(S,S); ctx.translate(-CX,-CY)

    // ── outer halo ──────────────────────────────────────────────
    if (glow > 0.1) {
      const halo = ctx.createRadialGradient(CX,CY,0, CX,CY,hw*2.2)
      halo.addColorStop(0,   `rgba(0,210,255,${alpha*glow*0.28})`)
      halo.addColorStop(0.45,`rgba(0,80,200,${alpha*glow*0.12})`)
      halo.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = halo
      ctx.fillRect(0,0,W,H)
    }

    // ── chip body ────────────────────────────────────────────────
    ctx.shadowColor = '#00f5ff'
    ctx.shadowBlur  = 32 * glow
    ctx.lineWidth   = 1.8
    ctx.strokeStyle = `rgba(0,245,255,${alpha})`
    const bg = ctx.createLinearGradient(CX-hw,CY-hh, CX+hw,CY+hh)
    bg.addColorStop(0, `rgba(0,35,80,${alpha})`)
    bg.addColorStop(1, `rgba(0,12,44,${alpha})`)
    ctx.fillStyle = bg
    roundRect(CX-hw, CY-hh, hw*2, hh*2, 10)
    ctx.fill(); ctx.stroke()

    // ── inner grid ───────────────────────────────────────────────
    ctx.shadowBlur  = 0
    ctx.strokeStyle = `rgba(0,210,255,${alpha*0.25})`
    ctx.lineWidth   = 0.55
    const div = 5
    for (let g2=1; g2<div; g2++) {
      ctx.beginPath(); ctx.moveTo(CX-hw+g2*(hw*2/div), CY-hh); ctx.lineTo(CX-hw+g2*(hw*2/div), CY+hh); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(CX-hw, CY-hh+g2*(hh*2/div)); ctx.lineTo(CX+hw, CY-hh+g2*(hh*2/div)); ctx.stroke()
    }

    // ── inner traces ─────────────────────────────────────────────
    ctx.shadowColor = '#00f5ff'
    ctx.shadowBlur  = 7 * glow
    ctx.lineWidth   = 1.2
    ctx.lineCap     = 'round'
    const IT = [
      { pts:[[CX-hw*0.72,CY-hh*0.62],[CX-hw*0.72,CY-hh*0.18],[CX-hw*0.18,CY-hh*0.18],[CX-hw*0.18,CY+hh*0.42]], col:'#00f5ff' },
      { pts:[[CX+hw*0.72,CY-hh*0.62],[CX+hw*0.72,CY+hh*0.12],[CX+hw*0.18,CY+hh*0.12],[CX+hw*0.18,CY+hh*0.62]], col:'#0077ff' },
      { pts:[[CX-hw*0.52,CY+hh*0.62],[CX+hw*0.52,CY+hh*0.62]],                                                   col:'#00ffaa' },
      { pts:[[CX-hw*0.72,CY+hh*0.22],[CX-hw*0.38,CY+hh*0.22],[CX-hw*0.38,CY-hh*0.62]],                          col:'#7700ff' },
      { pts:[[CX+hw*0.38,CY-hh*0.62],[CX+hw*0.38,CY-hh*0.12],[CX+hw*0.72,CY-hh*0.12]],                          col:'#00aaff' },
      { pts:[[CX-hw*0.18,CY-hh*0.62],[CX+hw*0.18,CY-hh*0.62]],                                                   col:'#ff7700' },
      { pts:[[CX-hw*0.72,CY],[CX-hw*0.38,CY]],                                                                    col:'#00f5ff' },
      { pts:[[CX+hw*0.38,CY+hh*0.38],[CX+hw*0.72,CY+hh*0.38]],                                                   col:'#0077ff' },
      { pts:[[CX-hw*0.52,CY-hh*0.38],[CX-hw*0.52,CY+hh*0.62]],                                                   col:'#00f5ff' },
      { pts:[[CX+hw*0.18,CY-hh*0.18],[CX+hw*0.52,CY-hh*0.18],[CX+hw*0.52,CY+hh*0.38]],                          col:'#7700ff' },
    ]
    IT.forEach(seg => {
      ctx.strokeStyle = rgba(seg.col, alpha*0.88)
      ctx.beginPath(); ctx.moveTo(seg.pts[0][0], seg.pts[0][1])
      for (let k=1; k<seg.pts.length; k++) ctx.lineTo(seg.pts[k][0], seg.pts[k][1])
      ctx.stroke()
    })

    // ── vias ─────────────────────────────────────────────────────
    const VIAS = [
      [CX-hw*0.72,CY-hh*0.62],[CX-hw*0.18,CY-hh*0.18],[CX-hw*0.18,CY+hh*0.42],
      [CX+hw*0.72,CY-hh*0.62],[CX+hw*0.18,CY+hh*0.12],[CX+hw*0.18,CY+hh*0.62],
      [CX-hw*0.52,CY+hh*0.62],[CX+hw*0.52,CY+hh*0.62],[CX-hw*0.72,CY+hh*0.22],
      [CX+hw*0.38,CY-hh*0.62],[CX+hw*0.72,CY-hh*0.12],[CX-hw*0.52,CY-hh*0.38],
      [CX+hw*0.52,CY-hh*0.18],[CX,CY],
    ]
    VIAS.forEach(([vx,vy],vi) => {
      const pulse = 0.65 + 0.35*Math.sin(tick*1.3+vi*0.7)
      ctx.beginPath(); ctx.arc(vx, vy, vi===13 ? 5 : 3.5, 0, Math.PI*2)
      ctx.fillStyle   = `rgba(0,245,255,${alpha*pulse})`
      ctx.shadowColor = '#00f5ff'
      ctx.shadowBlur  = glow * (vi===13 ? 18 : 10)
      ctx.fill()
    })

    // ── pins (all 4 sides) ────────────────────────────────────────
    const PIN_COUNT = 7
    ctx.lineWidth   = 2
    ctx.shadowBlur  = glow * 12
    ctx.shadowColor = '#00f5ff'

    for (let i=1; i<=PIN_COUNT; i++) {
      const py = CY - hh + i*(hh*2/(PIN_COUNT+1))
      // left & right
      ;[[-hw-24,-hw],[hw,hw+24]].forEach(([x1,x2]) => {
        ctx.strokeStyle = `rgba(0,230,255,${alpha*0.92})`
        ctx.beginPath(); ctx.moveTo(CX+x1,py); ctx.lineTo(CX+x2,py); ctx.stroke()
        ctx.fillStyle = `rgba(0,190,230,${alpha*0.85})`
        ctx.fillRect(CX+(x1<0?x1-5:x2), py-3.5, 5, 7)
      })
      const px = CX - hw + i*(hw*2/(PIN_COUNT+1))
      // top & bottom
      ;[[-hh-24,-hh],[hh,hh+24]].forEach(([y1,y2]) => {
        ctx.strokeStyle = `rgba(0,230,255,${alpha*0.92})`
        ctx.beginPath(); ctx.moveTo(px,CY+y1); ctx.lineTo(px,CY+y2); ctx.stroke()
        ctx.fillStyle = `rgba(0,190,230,${alpha*0.85})`
        ctx.fillRect(px-3.5, CY+(y1<0?y1-5:y2), 7, 5)
      })
    }

    // ── centre core pulse ─────────────────────────────────────────
    ctx.shadowBlur = 0
    const cg = ctx.createRadialGradient(CX,CY,0, CX,CY,hw*0.34)
    const cp = 0.65 + 0.35*Math.sin(tick*1.5)
    cg.addColorStop(0,   `rgba(0,255,255,${alpha*cp*0.9})`)
    cg.addColorStop(0.45,`rgba(0,160,255,${alpha*cp*0.45})`)
    cg.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle = cg
    ctx.beginPath(); ctx.arc(CX,CY,hw*0.38,0,Math.PI*2); ctx.fill()

    // ── concentric ring aura ──────────────────────────────────────
    for (let ring=0; ring<4; ring++) {
      const rs = hw*(0.45+ring*0.18)
      const rp = (0.5+0.5*Math.sin(tick*0.6+ring*1.1))*alpha*0.18
      ctx.beginPath(); ctx.arc(CX,CY,rs,0,Math.PI*2)
      ctx.strokeStyle = `rgba(0,245,255,${rp})`
      ctx.lineWidth = 0.5; ctx.shadowBlur = 0
      ctx.stroke()
    }

    ctx.restore()
  }

  // ── draw: circuit traces ──────────────────────────────────────────────────
  const drawTraces = (raw, {CX,CY}) => {
    let alpha
    if      (active('surge',raw)) alpha = eOut(ph('surge',raw))
    else if (active('build',raw) || active('alive',raw)) alpha = 1
    else if (active('reveal',raw)) alpha = lerp(1,0.5,ph('reveal',raw))
    else return
    TRACES.forEach(tr => {
      const p = eOut(clamp((alpha - tr.delay*0.55)/0.72, 0, 1))
      if (p < 0.01) return
      ctx.save()
      ctx.shadowColor = tr.col; ctx.shadowBlur = 10
      ctx.strokeStyle = rgba(tr.col, p*0.75)
      ctx.lineWidth   = tr.w + 0.5
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(CX+tr.pts[0].x, CY+tr.pts[0].y)
      tr.pts.slice(1).forEach(p2 => ctx.lineTo(CX+p2.x, CY+p2.y))
      ctx.stroke(); ctx.restore()
    })
  }

  // ── draw: moving pulses ───────────────────────────────────────────────────
  const drawPulses = raw => {
    const on = active('surge',raw)||active('build',raw)||active('alive',raw)||active('reveal',raw)
    if (!on) return
    PULSES.forEach(p => {
      if (p.tr.pts.length < 2) return
      const relPt = ptOn(p.tr.pts, p.t)
      const pos   = { x: p.CX+relPt.x, y: p.CY+relPt.y }
      p.tail.push({...pos})
      if (p.tail.length > 18) p.tail.shift()
      ctx.save()
      p.tail.forEach((tp,i) => {
        ctx.beginPath(); ctx.arc(tp.x,tp.y, p.r*(i/p.tail.length)*0.75, 0, Math.PI*2)
        ctx.fillStyle   = rgba(p.col, (i/p.tail.length)*0.5)
        ctx.shadowColor = p.col; ctx.shadowBlur = 5; ctx.fill()
      })
      ctx.beginPath(); ctx.arc(pos.x,pos.y, p.r+1.5, 0, Math.PI*2)
      ctx.fillStyle   = rgba(p.col, 0.95)
      ctx.shadowColor = p.col; ctx.shadowBlur = 22; ctx.fill()
      ctx.restore()
      p.t += p.spd
    })
    for (let i=PULSES.length-1; i>=0; i--) if (PULSES[i].t>=1) PULSES.splice(i,1)
  }

  // ── draw: buildings ───────────────────────────────────────────────────────
  const drawBuildings = (raw, tick, {W,CX,GROUND}) => {
    let prog, alpha
    if      (active('build',raw))  { prog = eOut(ph('build',raw),2.5); alpha = 1 }
    else if (active('alive',raw))  { prog = 1; alpha = 1 }
    else if (active('reveal',raw)) { prog = 1; alpha = lerp(1,0.6,ph('reveal',raw)) }
    else return

    BUILDINGS.forEach((b,i) => {
      const p = clamp((prog - b.delay)/(1-b.delay), 0, 1)
      if (p < 0.01) return
      const h = b.h * eOut(p,3)
      const bx = CX + b.ox - b.w/2
      const by = GROUND - h
      ctx.save()
      ctx.shadowColor = b.col; ctx.shadowBlur = 13

      const bg = ctx.createLinearGradient(bx,by, bx+b.w,by+h)
      bg.addColorStop(0,   rgba(b.col, alpha*0.24))
      bg.addColorStop(0.5, rgba(b.col, alpha*0.11))
      bg.addColorStop(1,   rgba(b.col, alpha*0.05))
      ctx.fillStyle = bg; ctx.fillRect(bx,by,b.w,h)
      ctx.strokeStyle = rgba(b.col, alpha*0.72)
      ctx.lineWidth = 0.9; ctx.strokeRect(bx,by,b.w,h)

      if (b.w > 20) {
        ctx.strokeStyle = rgba(b.col, alpha*0.22); ctx.lineWidth = 0.38
        ctx.beginPath(); ctx.moveTo(bx+b.w*0.35,by); ctx.lineTo(bx+b.w*0.35,by+h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(bx+b.w*0.7, by); ctx.lineTo(bx+b.w*0.7, by+h); ctx.stroke()
      }

      b.wins.forEach(({r,c,b:bright}) => {
        const wy = by+h-(r+1)*20+4, wx = bx+c*9+1.5
        if (wy<by || wy+14>by+h) return
        const fl = 0.6 + 0.4*Math.sin(tick*1.1+bright*20)
        ctx.fillStyle = rgba(b.col, alpha*bright*0.55*fl)
        ctx.fillRect(wx, wy, 6, 12)
      })

      if (b.hasTip && p > 0.82) {
        const tp = clamp((p-0.82)/0.18, 0, 1)
        ctx.strokeStyle = rgba(b.col, alpha*tp); ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(bx+b.w/2,by); ctx.lineTo(bx+b.w/2,by-b.tipH*tp); ctx.stroke()
        if (Math.sin(tick*3+i) > 0.3) {
          ctx.beginPath(); ctx.arc(bx+b.w/2, by-b.tipH*tp, 2.5, 0, Math.PI*2)
          ctx.fillStyle = `rgba(255,60,60,${alpha*tp})`
          ctx.shadowColor='#ff3333'; ctx.shadowBlur=10; ctx.fill()
        }
      }

      if (p > 0.94) {
        const sy = by + ((tick*38) % h)
        const sg = ctx.createLinearGradient(bx,sy-6,bx,sy+6)
        sg.addColorStop(0,'rgba(255,255,255,0)')
        sg.addColorStop(0.5, rgba(b.col, alpha*0.2))
        sg.addColorStop(1,'rgba(255,255,255,0)')
        ctx.fillStyle = sg; ctx.fillRect(bx,sy-6,b.w,12)
      }
      ctx.restore()
    })
  }

  // ── draw: ground plane ────────────────────────────────────────────────────
  const drawGround = (raw, {W,H,CX,GROUND}) => {
    const a = clamp(ph('build',raw)*3, 0, 1)
    if (a < 0.01) return
    ctx.save()
    const grd = ctx.createLinearGradient(0,GROUND,0,H)
    grd.addColorStop(0,    `rgba(0,245,255,${a*0.22})`)
    grd.addColorStop(0.15, `rgba(0,65,130,${a*0.2})`)
    grd.addColorStop(0.5,  `rgba(0,22,55,${a*0.32})`)
    grd.addColorStop(1,    `rgba(0,5,18,${a*0.92})`)
    ctx.fillStyle = grd; ctx.fillRect(0,GROUND,W,H-GROUND)

    ctx.strokeStyle = `rgba(0,245,255,${a*0.28})`; ctx.lineWidth = 0.55
    for (let i=-15; i<=15; i++) {
      ctx.beginPath(); ctx.moveTo(CX+i*52,GROUND); ctx.lineTo(CX+i*52*5,H+200); ctx.stroke()
    }
    for (let j=0; j<8; j++) {
      const y=GROUND+j*32, ww=lerp(W,18,j/7)
      ctx.beginPath(); ctx.moveTo(CX-ww/2,y); ctx.lineTo(CX+ww/2,y); ctx.stroke()
    }
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=24*a
    ctx.strokeStyle=`rgba(0,245,255,${a*0.8})`; ctx.lineWidth=1.2
    ctx.beginPath(); ctx.moveTo(0,GROUND); ctx.lineTo(W,GROUND); ctx.stroke()
    ctx.restore()
  }

  // ── draw: reflection ─────────────────────────────────────────────────────
  const drawReflection = (raw, tick, g) => {
    const a = clamp(ph('build',raw)*2-0.35, 0, 1) * 0.16
    if (a < 0.005) return
    ctx.save(); ctx.globalAlpha = a
    ctx.translate(0, g.GROUND*2); ctx.scale(1,-1)
    drawBuildings(raw, tick, g)
    ctx.restore()
  }

  // ── draw: fog layer ───────────────────────────────────────────────────────
  const drawFog = (raw, {W,GROUND}) => {
    const a = clamp(ph('build',raw)*2-0.22, 0, 0.88)
    if (a < 0.01) return
    const fg = ctx.createLinearGradient(0,GROUND-60,0,GROUND+200)
    fg.addColorStop(0,    'rgba(0,0,0,0)')
    fg.addColorStop(0.22, `rgba(0,14,38,${a*0.38})`)
    fg.addColorStop(0.6,  `rgba(0,10,30,${a*0.58})`)
    fg.addColorStop(1,    `rgba(0,5,20,${a*0.85})`)
    ctx.fillStyle=fg; ctx.fillRect(0,GROUND-60,W,260)
  }

  // ── draw: mega glow ───────────────────────────────────────────────────────
  const drawMegaGlow = (raw, {W,H,CX,CY}) => {
    const a = clamp(ph('alive',raw)*1.8, 0, 0.7) + clamp(ph('reveal',raw)*1.2, 0, 0.4)
    if (a < 0.01) return
    const gr = ctx.createRadialGradient(CX,CY,0, CX,CY,W*0.65)
    gr.addColorStop(0,   `rgba(0,110,255,${a*0.3})`)
    gr.addColorStop(0.3, `rgba(90,0,200,${a*0.12})`)
    gr.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle=gr; ctx.fillRect(0,0,W,H)
  }

  // ── draw: shockwave ───────────────────────────────────────────────────────
  const drawShockwave = (raw, {W,H,CX,CY}) => {
    if (!active('surge',raw)) return
    const p = eOut(ph('surge',raw), 1.5)
    if (p<0.01||p>0.97) return
    const rad = p*W*0.65
    const wg = ctx.createRadialGradient(CX,CY,rad*0.78,CX,CY,rad)
    wg.addColorStop(0,   'rgba(0,0,0,0)')
    wg.addColorStop(0.65,`rgba(0,245,255,${(1-p)*0.48})`)
    wg.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle=wg; ctx.fillRect(0,0,W,H)
  }

  // ── draw: SOFTCURSE SYSTEMS reveal text ───────────────────────────────────
  const drawRevealText = (raw, tick, {W,H,CX,CY}) => {
    const a = eOut(ph('reveal',raw), 2)
    if (a < 0.005) return

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Main wordmark
    const fontSize = Math.min(W*0.085, 72)
    ctx.font = `900 ${fontSize}px 'Orbitron', 'Share Tech Mono', monospace`
    ctx.letterSpacing = '0.22em'

    // Outer glow layers
    ctx.shadowColor = '#00f5ff'
    ctx.shadowBlur  = 60 * a
    ctx.fillStyle   = `rgba(0,245,255,${a*0.18})`
    ctx.fillText('SOFTCURSE SYSTEMS', CX, CY - H*0.01)

    ctx.shadowBlur  = 30 * a
    ctx.fillStyle   = `rgba(0,245,255,${a*0.35})`
    ctx.fillText('SOFTCURSE SYSTEMS', CX, CY - H*0.01)

    // Crisp fill
    ctx.shadowBlur  = 12 * a
    ctx.fillStyle   = `rgba(255,255,255,${a*0.92})`
    ctx.fillText('SOFTCURSE SYSTEMS', CX, CY - H*0.01)

    // Tagline
    const tagSize = Math.min(W*0.018, 14)
    ctx.font      = `400 ${tagSize}px 'Share Tech Mono', monospace`
    ctx.shadowBlur = 10 * a
    ctx.fillStyle  = `rgba(0,245,255,${a*0.7})`
    ctx.fillText('URBAN GENESIS ENGINE  //  v2025.ALPHA', CX, CY + fontSize*0.85)

    // Horizontal rule
    const rw  = Math.min(W*0.5, 400)
    const ry  = CY - H*0.01 - fontSize*0.72
    const lGrd = ctx.createLinearGradient(CX-rw/2,0, CX+rw/2,0)
    lGrd.addColorStop(0,   'rgba(0,245,255,0)')
    lGrd.addColorStop(0.5, `rgba(0,245,255,${a*0.6})`)
    lGrd.addColorStop(1,   'rgba(0,245,255,0)')
    ctx.strokeStyle = lGrd; ctx.lineWidth = 1; ctx.shadowBlur = 0
    ctx.beginPath(); ctx.moveTo(CX-rw/2,ry); ctx.lineTo(CX+rw/2,ry); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(CX-rw/2,ry+fontSize*1.7); ctx.lineTo(CX+rw/2,ry+fontSize*1.7); ctx.stroke()

    ctx.restore()
  }

  // ── draw: vignette ────────────────────────────────────────────────────────
  const drawVignette = ({W,H,CX,CY}) => {
    const vg = ctx.createRadialGradient(CX,CY,W*0.18, CX,CY,W*0.78)
    vg.addColorStop(0,'rgba(0,0,0,0)')
    vg.addColorStop(1,'rgba(0,0,10,0.88)')
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H)
  }

  // ── main RAF loop ─────────────────────────────────────────────────────────
  let startTs = null, rafId = null, stopped = false

  const frame = ts => {
    if (stopped) return
    if (!startTs) startTs = ts
    const raw  = Math.min((ts - startTs) / totalMs, 1)
    const tick = ts / 1000
    const g    = geo()
    const {CX,CY} = g

    // spawn pulses
    const inSurge = active('surge',raw)
    const inBuild = active('build',raw)
    const inAlive = active('alive',raw)||active('reveal',raw)
    const rate    = inAlive ? 0.12 : inBuild ? 0.22 : inSurge ? 0.32 : 2
    if (Math.random() > rate) spawnPulse(CX, CY)

    drawBg(raw,g)
    drawStars(raw,g)
    drawMegaGlow(raw,g)
    drawShockwave(raw,g)
    drawGround(raw,g)
    drawTraces(raw,g)
    drawPulses(raw)
    drawBuildings(raw,tick,g)
    drawReflection(raw,tick,g)
    drawFog(raw,g)
    drawChip(raw,tick,g)
    drawVignette(g)
    drawRevealText(raw,tick,g)

    // scanlines
    ctx.globalAlpha = 0.022
    for (let y=0; y<g.H; y+=2) { ctx.fillStyle='#000'; ctx.fillRect(0,y,g.W,1) }
    ctx.globalAlpha = 1

    rafId = requestAnimationFrame(frame)
  }

  rafId = requestAnimationFrame(frame)
  return () => { stopped = true; cancelAnimationFrame(rafId) }
}

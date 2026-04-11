import { useState, useEffect, useRef } from 'react'
import styles from './BootScreen.module.css'

const LINES = [
  '> SOFTCURSE OS v2025.ALPHA',
  '> LOADING CORE MODULES........',
  '> INITIALIZING LAB SYSTEMS....',
  '> MOUNTING STUDIO ASSETS......',
  '> ESTABLISHING DARK PROTOCOLS.',
  '> ALL SYSTEMS OPERATIONAL.',
]

const DISPLAY_MS = 4400

function runCityAnimation(canvas) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const CX = W / 2, CY = H * 0.46
  const GROUND = CY + H * 0.13

  const PH = {
    dormant: [0,    0.08],
    boot:    [0.08, 0.22],
    surge:   [0.22, 0.40],
    build:   [0.40, 0.74],
    alive:   [0.74, 1.00],
  }

  const easeOut = (t, p = 2) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), p)
  const lerp    = (a, b, t)  => a + (b - a) * Math.min(1, Math.max(0, t))
  const clamp   = (v, a, b)  => Math.min(b, Math.max(a, v))
  const rng     = s => { let x = Math.sin(s + 1.3) * 93758.5453; return x - Math.floor(x) }
  const ph      = (n, r) => { const [s,e]=PH[n]; return clamp((r-s)/(e-s),0,1) }
  const active  = (n, r) => { const [s,e]=PH[n]; return r>=s && r<=e }
  const hexRgb  = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]
  const rgba    = (col, a) => { const[r,g,b]=hexRgb(col); return `rgba(${r},${g},${b},${clamp(a,0,1)})` }

  const roundRect = (x,y,w,h,r) => {
    ctx.beginPath()
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r)
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r)
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath()
  }

  // Traces
  const TCOLS = ['#00f5ff','#00f5ff','#00aaff','#7700ff','#00ffaa','#ff7700','#0055ff']
  const TRACES = Array.from({length:52},(_,i)=>{
    const ang=(i/52)*Math.PI*2
    const pts=[{x:CX+rng(i)*60-30,y:CY+rng(i*3)*60-30}]
    let cx=pts[0].x,cy=pts[0].y
    for(let s=0;s<2+Math.floor(rng(i*7)*3);s++){
      if(s%2===0) cx+=Math.cos(ang)*(55+rng(i*s)*75)
      else        cy+=Math.sin(ang)*(55+rng(i*s)*75)
      pts.push({x:cx,y:cy})
    }
    return{pts,col:TCOLS[i%TCOLS.length],delay:i/52,w:rng(i*11)*.8+.4}
  })

  // Buildings
  const BCOLS=['#00f5ff','#0077ff','#7700ff','#00ffaa','#ff7700','#00aaff']
  const BRAW=[
    [-310,22,340],[-282,16,200],[-260,28,400],[-226,18,260],[-202,35,480],
    [-162,20,220],[-136,30,520],[-100,22,340],[-74,32,560],[-36,38,600],
    [-2,34,580],[36,30,520],[70,24,400],[98,28,320],[130,22,460],
    [158,20,260],[182,32,300],[218,20,240],[244,18,200],[268,26,340],
    [298,20,180],[324,18,140],[-338,18,160],[346,16,120],[-358,16,110],
    [366,14,90],[80,14,160],[-120,14,140],
  ]
  const BUILDINGS=BRAW.map((d,i)=>{
    const[ox,w,h]=d, col=BCOLS[i%BCOLS.length]
    const wins=[]
    for(let r=0;r<Math.ceil(h/20);r++)
      for(let c=0;c<Math.floor(w/9);c++)
        if(rng(i*r+c*3)>.4) wins.push({r,c,b:rng(i+r*c)*.8+.2})
    return{ox,w,h,col,delay:.15+Math.abs(ox)/700*.7,wins,hasTip:rng(i*17)>.5,tipH:20+rng(i)*50}
  })

  // Pulses
  const PULSES=[]
  const ptOn=(pts,t)=>{
    const n=pts.length-1,si=Math.min(Math.floor(t*n),n-1),f=t*n-si
    return{x:lerp(pts[si].x,pts[si+1].x,f),y:lerp(pts[si].y,pts[si+1].y,f)}
  }
  const spawnPulse=()=>{
    if(PULSES.length>55) return
    const tr=TRACES[Math.floor(Math.random()*TRACES.length)]
    PULSES.push({tr,t:0,spd:.007+Math.random()*.018,col:tr.col,r:1.5+Math.random()*2.5,tail:[]})
  }

  // Draw functions
  const drawBg=raw=>{
    ctx.fillStyle='#000008'; ctx.fillRect(0,0,W,H)
    const ca=clamp(ph('build',raw)*.8+ph('alive',raw)*.5,0,1.2)
    if(ca>.01){
      const g=ctx.createRadialGradient(CX,GROUND,0,CX,GROUND,W*.65)
      g.addColorStop(0,`rgba(0,40,100,${ca*.22})`); g.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H)
    }
  }

  const drawStars=raw=>{
    const a=1-clamp(ph('boot',raw)*2,0,1)
    if(a<.01) return
    for(let i=0;i<120;i++){
      const x=rng(i*2.3)*W,y=rng(i*5.7)*H*.4
      ctx.beginPath(); ctx.arc(x,y,.8,0,Math.PI*2)
      ctx.fillStyle=`rgba(160,200,255,${a*(.5+.5*Math.sin(raw*12+i))*.7})`; ctx.fill()
    }
  }

  const drawChip=(raw,tick)=>{
    let alpha,glow
    if(active('dormant',raw)){alpha=easeOut(ph('dormant',raw))*.55;glow=ph('dormant',raw)*.4}
    else if(active('boot',raw)){alpha=lerp(.55,1,easeOut(ph('boot',raw)));glow=easeOut(ph('boot',raw))*1.3}
    else{alpha=1;glow=1+Math.sin(tick*.9)*.2}
    if(alpha<.005) return
    ctx.save()
    const S=1+Math.sin(tick*1.1)*.008
    ctx.translate(CX,CY); ctx.scale(S,S); ctx.translate(-CX,-CY)
    const hw=W*.125,hh=H*.125
    if(glow>.1){
      const halo=ctx.createRadialGradient(CX,CY,0,CX,CY,hw*1.9)
      halo.addColorStop(0,`rgba(0,200,255,${alpha*glow*.28})`)
      halo.addColorStop(.5,`rgba(0,80,180,${alpha*glow*.12})`); halo.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle=halo; ctx.fillRect(0,0,W,H)
    }
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=28*glow
    ctx.strokeStyle=`rgba(0,245,255,${alpha})`; ctx.lineWidth=1.8
    const bg=ctx.createLinearGradient(CX-hw,CY-hh,CX+hw,CY+hh)
    bg.addColorStop(0,`rgba(0,30,70,${alpha})`); bg.addColorStop(1,`rgba(0,10,40,${alpha})`)
    ctx.fillStyle=bg; roundRect(CX-hw,CY-hh,hw*2,hh*2,10); ctx.fill(); ctx.stroke()
    ctx.strokeStyle=`rgba(0,200,255,${alpha*.28})`; ctx.lineWidth=.6; ctx.shadowBlur=0
    for(let g2=1;g2<5;g2++){
      ctx.beginPath(); ctx.moveTo(CX-hw+g2*(hw*2/5),CY-hh); ctx.lineTo(CX-hw+g2*(hw*2/5),CY+hh); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(CX-hw,CY-hh+g2*(hh*2/5)); ctx.lineTo(CX+hw,CY-hh+g2*(hh*2/5)); ctx.stroke()
    }
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=6*glow; ctx.lineWidth=1.2; ctx.lineCap='round'
    const IT=[
      [[CX-hw*.7,CY-hh*.6],[CX-hw*.7,CY-hh*.2],[CX-hw*.2,CY-hh*.2],[CX-hw*.2,CY+hh*.4],'#00f5ff'],
      [[CX+hw*.7,CY-hh*.6],[CX+hw*.7,CY+hh*.1],[CX+hw*.2,CY+hh*.1],[CX+hw*.2,CY+hh*.6],'#0077ff'],
      [[CX-hw*.5,CY+hh*.6],[CX+hw*.5,CY+hh*.6],'#00ffaa'],
      [[CX-hw*.7,CY+hh*.2],[CX-hw*.4,CY+hh*.2],[CX-hw*.4,CY-hh*.6],'#7700ff'],
      [[CX+hw*.4,CY-hh*.6],[CX+hw*.4,CY-hh*.1],[CX+hw*.7,CY-hh*.1],'#00aaff'],
    ]
    IT.forEach(seg=>{
      ctx.strokeStyle=rgba(seg[seg.length-1],alpha*.85)
      ctx.beginPath(); ctx.moveTo(seg[0][0],seg[0][1])
      for(let k=1;k<seg.length-1;k++) ctx.lineTo(seg[k][0],seg[k][1])
      ctx.stroke()
    })
    const VIAS=[[CX-hw*.7,CY-hh*.6],[CX-hw*.2,CY-hh*.2],[CX-hw*.2,CY+hh*.4],
      [CX+hw*.7,CY-hh*.6],[CX+hw*.2,CY+hh*.1],[CX+hw*.2,CY+hh*.6],
      [CX-hw*.5,CY+hh*.6],[CX+hw*.5,CY+hh*.6],[CX-hw*.7,CY+hh*.2],
      [CX+hw*.4,CY-hh*.6],[CX+hw*.7,CY-hh*.1]]
    VIAS.forEach(([vx,vy],vi)=>{
      ctx.beginPath(); ctx.arc(vx,vy,3,0,Math.PI*2)
      ctx.fillStyle=`rgba(0,245,255,${alpha*(.7+.3*Math.sin(tick*1.2+vi))})`
      ctx.shadowColor='#00f5ff'; ctx.shadowBlur=glow*10; ctx.fill()
    })
    for(let i=1;i<=6;i++){
      const py=CY-hh+i*(hh*2/7)
      ctx.strokeStyle=`rgba(0,230,255,${alpha*.9})`; ctx.lineWidth=2
      ;[[-hw-22,-hw],[hw,hw+22]].forEach(([x1,x2])=>{
        ctx.beginPath(); ctx.moveTo(CX+x1,py); ctx.lineTo(CX+x2,py); ctx.stroke()
        ctx.fillStyle=`rgba(0,180,220,${alpha*.8})`; ctx.fillRect(CX+(x1<0?x1-5:x2),py-4,5,8)
      })
      const px=CX-hw+i*(hw*2/7)
      ;[[-hh-22,-hh],[hh,hh+22]].forEach(([y1,y2])=>{
        ctx.beginPath(); ctx.moveTo(px,CY+y1); ctx.lineTo(px,CY+y2); ctx.stroke()
        ctx.fillStyle=`rgba(0,180,220,${alpha*.8})`; ctx.fillRect(px-4,CY+(y1<0?y1-5:y2),8,5)
      })
    }
    const cg=ctx.createRadialGradient(CX,CY,0,CX,CY,hw*.3)
    cg.addColorStop(0,`rgba(0,255,255,${alpha*(.7+.3*Math.sin(tick*1.4))*.85})`)
    cg.addColorStop(.4,`rgba(0,150,255,${alpha*.4})`); cg.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(CX,CY,hw*.35,0,Math.PI*2); ctx.fill()
    ctx.restore()
  }

  const drawTraces=raw=>{
    let alpha
    if(active('surge',raw)) alpha=easeOut(ph('surge',raw))
    else if(active('build',raw)||active('alive',raw)) alpha=1
    else return
    TRACES.forEach(tr=>{
      const p=easeOut(clamp((alpha-tr.delay*.6)/.7,0,1))
      if(p<.01) return
      ctx.save(); ctx.shadowColor=tr.col; ctx.shadowBlur=10
      ctx.strokeStyle=rgba(tr.col,p*.75); ctx.lineWidth=tr.w+.5; ctx.lineCap='round'; ctx.lineJoin='round'
      ctx.beginPath(); ctx.moveTo(tr.pts[0].x,tr.pts[0].y)
      tr.pts.slice(1).forEach(p2=>ctx.lineTo(p2.x,p2.y))
      ctx.stroke(); ctx.restore()
    })
  }

  const drawPulses=raw=>{
    if(!active('surge',raw)&&!active('build',raw)&&!active('alive',raw)) return
    PULSES.forEach(p=>{
      if(p.tr.pts.length<2) return
      const pos=ptOn(p.tr.pts,p.t)
      p.tail.push({...pos}); if(p.tail.length>16) p.tail.shift()
      ctx.save()
      p.tail.forEach((tp,i)=>{
        ctx.beginPath(); ctx.arc(tp.x,tp.y,p.r*(i/p.tail.length)*.8,0,Math.PI*2)
        ctx.fillStyle=rgba(p.col,(i/p.tail.length)*.5); ctx.shadowColor=p.col; ctx.shadowBlur=6; ctx.fill()
      })
      ctx.beginPath(); ctx.arc(pos.x,pos.y,p.r+1.5,0,Math.PI*2)
      ctx.fillStyle=rgba(p.col,.95); ctx.shadowColor=p.col; ctx.shadowBlur=20; ctx.fill()
      ctx.restore(); p.t+=p.spd
    })
    for(let i=PULSES.length-1;i>=0;i--) if(PULSES[i].t>=1) PULSES.splice(i,1)
  }

  const drawBuildings=(raw,tick)=>{
    let prog,alpha
    if(active('build',raw)){prog=easeOut(ph('build',raw),2.5);alpha=1}
    else if(active('alive',raw)){prog=1;alpha=1}
    else return
    BUILDINGS.forEach((b,i)=>{
      const p=clamp((prog-b.delay)/(1-b.delay),0,1)
      if(p<.01) return
      const h=b.h*easeOut(p,3), bx=CX+b.ox-b.w/2, by=GROUND-h
      ctx.save(); ctx.shadowColor=b.col; ctx.shadowBlur=12
      const bg=ctx.createLinearGradient(bx,by,bx+b.w,by+h)
      bg.addColorStop(0,rgba(b.col,alpha*.22)); bg.addColorStop(.5,rgba(b.col,alpha*.1)); bg.addColorStop(1,rgba(b.col,alpha*.05))
      ctx.fillStyle=bg; ctx.fillRect(bx,by,b.w,h)
      ctx.strokeStyle=rgba(b.col,alpha*.7); ctx.lineWidth=.9; ctx.strokeRect(bx,by,b.w,h)
      if(b.w>20){
        ctx.strokeStyle=rgba(b.col,alpha*.22); ctx.lineWidth=.4
        ctx.beginPath(); ctx.moveTo(bx+b.w*.35,by); ctx.lineTo(bx+b.w*.35,by+h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(bx+b.w*.7,by);  ctx.lineTo(bx+b.w*.7,by+h);  ctx.stroke()
      }
      b.wins.forEach(({r,c,b:bright})=>{
        const wy=by+h-(r+1)*20+4, wx=bx+c*9+1.5
        if(wy<by||wy+14>by+h) return
        ctx.fillStyle=rgba(b.col,alpha*bright*.55*(.6+.4*Math.sin(tick*1.1+bright*20)))
        ctx.fillRect(wx,wy,6,12)
      })
      if(b.hasTip&&p>.85){
        const tp=clamp((p-.85)/.15,0,1)
        ctx.strokeStyle=rgba(b.col,alpha*tp); ctx.lineWidth=1.5
        ctx.beginPath(); ctx.moveTo(bx+b.w/2,by); ctx.lineTo(bx+b.w/2,by-b.tipH*tp); ctx.stroke()
        if(Math.sin(tick*3+i)>.3){
          ctx.beginPath(); ctx.arc(bx+b.w/2,by-b.tipH*tp,2.5,0,Math.PI*2)
          ctx.fillStyle=`rgba(255,60,60,${alpha*tp})`; ctx.shadowColor='#ff3333'; ctx.shadowBlur=10; ctx.fill()
        }
      }
      if(p>.95){
        const sy=by+((tick*35)%h)
        const sg=ctx.createLinearGradient(bx,sy-6,bx,sy+6)
        sg.addColorStop(0,'rgba(255,255,255,0)'); sg.addColorStop(.5,rgba(b.col,alpha*.18)); sg.addColorStop(1,'rgba(255,255,255,0)')
        ctx.fillStyle=sg; ctx.fillRect(bx,sy-6,b.w,12)
      }
      ctx.restore()
    })
  }

  const drawReflection=(raw,tick)=>{
    const a=clamp(ph('build',raw)*2-.3,0,1)*.16
    if(a<.005) return
    ctx.save(); ctx.globalAlpha=a
    ctx.translate(0,GROUND*2); ctx.scale(1,-1); drawBuildings(raw,tick); ctx.restore()
  }

  const drawGround=raw=>{
    const a=clamp(ph('build',raw)*3,0,1)
    if(a<.01) return
    ctx.save()
    const grd=ctx.createLinearGradient(0,GROUND,0,H)
    grd.addColorStop(0,`rgba(0,245,255,${a*.2})`); grd.addColorStop(.15,`rgba(0,60,120,${a*.18})`)
    grd.addColorStop(.5,`rgba(0,20,50,${a*.3})`);  grd.addColorStop(1,`rgba(0,5,15,${a*.9})`)
    ctx.fillStyle=grd; ctx.fillRect(0,GROUND,W,H-GROUND)
    ctx.strokeStyle=`rgba(0,245,255,${a*.28})`; ctx.lineWidth=.6
    for(let i=-14;i<=14;i++){
      ctx.beginPath(); ctx.moveTo(CX+i*55,GROUND); ctx.lineTo(CX+i*55*5,H+200); ctx.stroke()
    }
    for(let j=0;j<7;j++){
      const y=GROUND+j*35, ww=lerp(W,20,j/6)
      ctx.beginPath(); ctx.moveTo(CX-ww/2,y); ctx.lineTo(CX+ww/2,y); ctx.stroke()
    }
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=22*a
    ctx.strokeStyle=`rgba(0,245,255,${a*.75})`; ctx.lineWidth=1.2
    ctx.beginPath(); ctx.moveTo(0,GROUND); ctx.lineTo(W,GROUND); ctx.stroke()
    ctx.restore()
  }

  const drawFog=raw=>{
    const a=clamp(ph('build',raw)*2-.2,0,.85)
    if(a<.01) return
    const fg=ctx.createLinearGradient(0,GROUND-50,0,GROUND+180)
    fg.addColorStop(0,'rgba(0,0,0,0)'); fg.addColorStop(.25,`rgba(0,15,40,${a*.38})`)
    fg.addColorStop(.6,`rgba(0,10,30,${a*.55})`); fg.addColorStop(1,`rgba(0,5,20,${a*.82})`)
    ctx.fillStyle=fg; ctx.fillRect(0,GROUND-50,W,230)
  }

  const drawMegaGlow=raw=>{
    const a=clamp(ph('alive',raw)*2,0,.6)
    if(a<.01) return
    const gr=ctx.createRadialGradient(CX,CY,0,CX,CY,W*.6)
    gr.addColorStop(0,`rgba(0,100,255,${a*.35})`); gr.addColorStop(.3,`rgba(80,0,200,${a*.12})`)
    gr.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=gr; ctx.fillRect(0,0,W,H)
  }

  const drawShockwave=raw=>{
    if(!active('surge',raw)) return
    const p=easeOut(ph('surge',raw),1.5)
    if(p<.01||p>.97) return
    const rad=p*W*.62
    const wg=ctx.createRadialGradient(CX,CY,rad*.8,CX,CY,rad)
    wg.addColorStop(0,'rgba(0,0,0,0)'); wg.addColorStop(.7,`rgba(0,245,255,${(1-p)*.45})`); wg.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=wg; ctx.fillRect(0,0,W,H)
  }

  const drawVignette=()=>{
    const vg=ctx.createRadialGradient(CX,CY,W*.2,CX,CY,W*.75)
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,8,.9)')
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H)
  }

  let startTs=null, rafId=null, stopped=false
  const frame=ts=>{
    if(stopped) return
    if(!startTs) startTs=ts
    const raw=Math.min((ts-startTs)/DISPLAY_MS,1)
    const tick=ts/1000
    const inSurge=active('surge',raw),inBuild=active('build',raw),inAlive=active('alive',raw)
    if(Math.random()>(inAlive?.12:inBuild?.22:inSurge?.32:1)) spawnPulse()
    drawBg(raw); drawStars(raw); drawMegaGlow(raw); drawShockwave(raw)
    drawGround(raw); drawTraces(raw); drawPulses(raw)
    drawBuildings(raw,tick); drawReflection(raw,tick); drawFog(raw)
    drawChip(raw,tick); drawVignette()
    ctx.globalAlpha=.022
    for(let y=0;y<H;y+=2){ctx.fillStyle='#000';ctx.fillRect(0,y,W,1)}
    ctx.globalAlpha=1
    rafId=requestAnimationFrame(frame)
  }
  rafId=requestAnimationFrame(frame)
  return ()=>{ stopped=true; cancelAnimationFrame(rafId) }
}

export default function BootScreen({ onComplete }) {
  const canvasRef  = useRef(null)
  const [lineIndex, setLineIndex] = useState(0)
  const [progress,  setProgress]  = useState(0)
  const [fading,    setFading]    = useState(false)

  // Canvas city animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    return runCityAnimation(canvas)
  }, [])

  // Terminal lines — spaced to sync with animation phases
  useEffect(() => {
    if (lineIndex >= LINES.length) return
    const delays = [200, 620, 1050, 1800, 2600, 3300]
    const wait = lineIndex === 0 ? delays[0] : delays[lineIndex] - delays[lineIndex - 1]
    const t = setTimeout(() => setLineIndex(i => i + 1), wait)
    return () => clearTimeout(t)
  }, [lineIndex])

  // Progress bar tied to DISPLAY_MS
  useEffect(() => {
    const start = performance.now()
    let raf
    const tick = now => {
      const p = Math.min((now - start) / DISPLAY_MS * 100, 100)
      setProgress(p)
      if (p < 100) raf = requestAnimationFrame(tick)
      else setTimeout(() => { setFading(true); setTimeout(onComplete, 750) }, 120)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onComplete])

  return (
    <div className={`${styles.screen} ${fading ? styles.fading : ''}`} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.cityCanvas} />

      <div className={styles.inner}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="" className={styles.logoImg} />
          <span className={styles.logoText}>SOFTCURSE</span>
        </div>

        <div className={styles.terminal}>
          {LINES.slice(0, lineIndex).map((line, i) => (
            <div key={i} className={styles.line}>{line}</div>
          ))}
          {lineIndex < LINES.length && (
            <div className={styles.line}>
              {LINES[lineIndex]}<span className={styles.cursor}>█</span>
            </div>
          )}
        </div>

        <div className={styles.barWrap}>
          <div className={styles.barLabel}>
            <span>SYSTEM INIT</span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${progress}%` }} />
            <div className={styles.barGlow}  style={{ left:  `${progress}%` }} />
          </div>
        </div>

        <div className={styles.status}>
          <span className={styles.statusDot} />
          {progress < 100 ? 'INITIALIZING...' : 'READY'}
        </div>
      </div>
    </div>
  )
}

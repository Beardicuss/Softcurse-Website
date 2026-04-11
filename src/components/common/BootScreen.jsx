import { useEffect, useRef, useState } from 'react'
import styles from './BootScreen.module.css'

// ─── timing ────────────────────────────────────────────────────────────────
//  dormant  0 – 0.6 s   chip materialises
//  boot     0.6 – 2 s   chip fully animates
//  surge    2 – 3.5 s   power surge outward
//  build    3.5 – 7 s   city rises
//  alive    7 – 9 s     city breathing
//  hold     9 – 12 s    SOFTCURSE SYSTEMS on screen (3 s)
//  fade     12 s+        canvas fades → site reveals
// ───────────────────────────────────────────────────────────────────────────
const ANIM_MS = 12000
const FADE_MS = 1100

export default function BootScreen({ onComplete }) {
  const canvasRef = useRef(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    setSize()
    window.addEventListener('resize', setSize)
    const stop = runCity(canvas, ANIM_MS)
    const t = setTimeout(() => { setFading(true); setTimeout(onComplete, FADE_MS) }, ANIM_MS)
    return () => { stop(); clearTimeout(t); window.removeEventListener('resize', setSize) }
  }, [onComplete])

  return (
    <div className={`${styles.screen} ${fading ? styles.fading : ''}`} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function runCity(canvas, totalMs) {
  const ctx = canvas.getContext('2d')

  // Phase windows as fractions of totalMs
  const PH = {
    dormant : [0,      0.050],
    boot    : [0.050,  0.167],
    surge   : [0.167,  0.292],
    build   : [0.292,  0.583],
    alive   : [0.583,  0.750],
    hold    : [0.750,  1.000],
  }

  const eOut  = (t,p=2) => 1-Math.pow(1-clamp(t,0,1),p)
  const eIn   = (t,p=2) => Math.pow(clamp(t,0,1),p)
  const lerp  = (a,b,t) => a+(b-a)*clamp(t,0,1)
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v))
  const rng   = s => { let x=Math.sin(s+1.3)*93758.5453; return x-Math.floor(x) }
  const ph    = (n,r) => { const[s,e]=PH[n]; return clamp((r-s)/(e-s),0,1) }
  const active= (n,r) => { const[s,e]=PH[n]; return r>=s&&r<e }
  const hexRgb= h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]
  const rgba  = (col,a) => { const[r,g,b]=hexRgb(col); return `rgba(${r},${g},${b},${clamp(a,0,1)})` }
  const rc    = (x,y,w,h,r) => {
    ctx.beginPath()
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r)
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r)
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r)
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath()
  }

  const geo = () => {
    const W=canvas.width, H=canvas.height, CX=W/2, CY=H*0.44
    const CS=Math.min(W,H)*0.22
    return { W, H, CX, CY, CS, GROUND: CY+H*0.14 }
  }

  // ── traces (relative to chip centre) ──────────────────────────────────────
  const TCOLS=['#00f5ff','#00f5ff','#00aaff','#7700ff','#00ffaa','#ff7700','#0055ff']
  const TRACES=Array.from({length:56},(_,i)=>{
    const ang=(i/56)*Math.PI*2
    const pts=[{x:rng(i)*60-30,y:rng(i*3)*60-30}]
    let cx=pts[0].x,cy=pts[0].y
    for(let s=0;s<2+Math.floor(rng(i*7)*3);s++){
      s%2===0?cx+=Math.cos(ang)*(60+rng(i*s+1)*90):cy+=Math.sin(ang)*(60+rng(i*s+1)*90)
      pts.push({x:cx,y:cy})
    }
    return{pts,col:TCOLS[i%TCOLS.length],delay:i/56,w:rng(i*11)*0.9+0.4}
  })

  // ── buildings ──────────────────────────────────────────────────────────────
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
    const[ox,w,h]=d,col=BCOLS[i%BCOLS.length]
    const wins=[]
    for(let r=0;r<Math.ceil(h/20);r++)
      for(let c=0;c<Math.floor(w/9);c++)
        if(rng(i*r+c*3)>0.4) wins.push({r,c,b:rng(i+r*c)*0.8+0.2})
    return{ox,w,h,col,delay:0.10+Math.abs(ox)/700*0.75,wins,hasTip:rng(i*17)>0.5,tipH:20+rng(i)*55}
  })

  // ── pulses ─────────────────────────────────────────────────────────────────
  const PULSES=[]
  const ptOn=(pts,t)=>{
    const n=pts.length-1,si=Math.min(Math.floor(t*n),n-1),f=t*n-si
    return{x:lerp(pts[si].x,pts[si+1].x,f),y:lerp(pts[si].y,pts[si+1].y,f)}
  }
  const spawnPulse=(CX,CY)=>{
    if(PULSES.length>65) return
    const tr=TRACES[Math.floor(Math.random()*TRACES.length)]
    PULSES.push({tr,t:0,spd:0.004+Math.random()*0.012,col:tr.col,r:1.5+Math.random()*2.5,tail:[],CX,CY})
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  CHIP  — the centrepiece
  // ─────────────────────────────────────────────────────────────────────────
  const drawChip=(raw,tick,{W,H,CX,CY,CS})=>{
    const hw=CS/2, hh=CS/2

    // alpha / glow per phase
    let alpha,glow
    if(active('dormant',raw)){
      alpha=eOut(ph('dormant',raw),1.5)*0.65
      glow=ph('dormant',raw)*0.6
    } else if(active('boot',raw)){
      alpha=lerp(0.65,1,eOut(ph('boot',raw)))
      glow=lerp(0.6,1.6,eOut(ph('boot',raw)))
    } else if(active('hold',raw)){
      const hp=ph('hold',raw)
      alpha=lerp(1,0.25,eIn(hp,2))
      glow=lerp(1.4,0.2,hp)
    } else {
      alpha=1
      glow=1.2+Math.sin(tick*0.8)*0.3
    }
    if(alpha<0.004) return

    ctx.save()
    // subtle breathe scale
    const S=1+Math.sin(tick*1.05)*0.006
    ctx.translate(CX,CY); ctx.scale(S,S); ctx.translate(-CX,-CY)

    // ── 1. outer atmospheric halo ──────────────────────────────────────────
    const haloR=hw*2.8
    const halo=ctx.createRadialGradient(CX,CY,hw*0.5,CX,CY,haloR)
    halo.addColorStop(0,  `rgba(0,220,255,${alpha*glow*0.22})`)
    halo.addColorStop(0.4,`rgba(0,80,200,${alpha*glow*0.10})`)
    halo.addColorStop(1,  'rgba(0,0,0,0)')
    ctx.fillStyle=halo; ctx.beginPath(); ctx.arc(CX,CY,haloR,0,Math.PI*2); ctx.fill()

    // ── 2. pin traces (all 4 sides, 7 pins each) ──────────────────────────
    const PIN=7, PINalpha=alpha*0.94
    ctx.lineWidth=1.8; ctx.lineCap='butt'
    ctx.shadowColor='#00e8ff'; ctx.shadowBlur=glow*14
    for(let i=1;i<=PIN;i++){
      const py=CY-hh+i*(hh*2/(PIN+1))
      const px=CX-hw+i*(hw*2/(PIN+1))
      ;[[-hw-26,-hw],[hw,hw+26]].forEach(([x1,x2])=>{
        // pin track
        ctx.strokeStyle=`rgba(0,210,255,${PINalpha*0.55})`
        ctx.beginPath(); ctx.moveTo(CX+x1,py); ctx.lineTo(CX+x2,py); ctx.stroke()
        // pad
        const px2=CX+(x1<0?x1-5:x2)
        ctx.fillStyle=`rgba(0,200,240,${PINalpha*0.9})`
        ctx.fillRect(px2,py-3.5,5,7)
        // hot pin tip glow
        const tipX=CX+(x1<0?x1-5:x2+5)
        ctx.beginPath(); ctx.arc(tipX,py,1.8,0,Math.PI*2)
        ctx.fillStyle=`rgba(100,255,255,${PINalpha*(0.6+0.4*Math.sin(tick*2+i))})`
        ctx.shadowBlur=glow*8; ctx.fill()
      })
      ;[[-hh-26,-hh],[hh,hh+26]].forEach(([y1,y2])=>{
        ctx.strokeStyle=`rgba(0,210,255,${PINalpha*0.55})`
        ctx.beginPath(); ctx.moveTo(px,CY+y1); ctx.lineTo(px,CY+y2); ctx.stroke()
        const py2=CY+(y1<0?y1-5:y2)
        ctx.fillStyle=`rgba(0,200,240,${PINalpha*0.9})`
        ctx.fillRect(px-3.5,py2,7,5)
        const tipY=CY+(y1<0?y1-5:y2+5)
        ctx.beginPath(); ctx.arc(px,tipY,1.8,0,Math.PI*2)
        ctx.fillStyle=`rgba(100,255,255,${PINalpha*(0.6+0.4*Math.sin(tick*2+i+3))})`
        ctx.shadowBlur=glow*8; ctx.fill()
      })
    }

    // ── 3. chip body ───────────────────────────────────────────────────────
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=glow*36
    const bodyGrad=ctx.createLinearGradient(CX-hw,CY-hh,CX+hw,CY+hh)
    bodyGrad.addColorStop(0,`rgba(2,22,58,${alpha})`)
    bodyGrad.addColorStop(0.5,`rgba(0,14,42,${alpha})`)
    bodyGrad.addColorStop(1,`rgba(0,8,30,${alpha})`)
    ctx.fillStyle=bodyGrad
    rc(CX-hw,CY-hh,hw*2,hh*2,10); ctx.fill()
    ctx.strokeStyle=`rgba(0,245,255,${alpha})`; ctx.lineWidth=1.8; ctx.stroke()

    // ── 4. inner grid substrate ────────────────────────────────────────────
    ctx.shadowBlur=0
    const DIV=6
    for(let g2=1;g2<DIV;g2++){
      const xp=CX-hw+g2*(hw*2/DIV), yp=CY-hh+g2*(hh*2/DIV)
      const fade=0.12+0.06*Math.sin(tick*0.4+g2)
      ctx.strokeStyle=`rgba(0,200,255,${alpha*fade})`; ctx.lineWidth=0.5
      ctx.beginPath(); ctx.moveTo(xp,CY-hh); ctx.lineTo(xp,CY+hh); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(CX-hw,yp); ctx.lineTo(CX+hw,yp); ctx.stroke()
    }

    // ── 5. animated scan line across chip ─────────────────────────────────
    if(glow>0.5){
      const scanY=CY-hh+((tick*hw*0.7)%(hh*2))
      const sg=ctx.createLinearGradient(CX-hw,scanY-3,CX-hw,scanY+3)
      sg.addColorStop(0,'rgba(0,255,255,0)')
      sg.addColorStop(0.5,`rgba(0,255,255,${alpha*glow*0.35})`)
      sg.addColorStop(1,'rgba(0,255,255,0)')
      ctx.fillStyle=sg; ctx.fillRect(CX-hw,scanY-3,hw*2,6)
    }

    // ── 6. inner circuit traces ────────────────────────────────────────────
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=glow*8
    ctx.lineWidth=1.1; ctx.lineCap='round'
    const ROUTES=[
      {pts:[[CX-hw*0.74,CY-hh*0.65],[CX-hw*0.74,CY-hh*0.18],[CX-hw*0.2,CY-hh*0.18],[CX-hw*0.2,CY+hh*0.44]],col:'#00f5ff'},
      {pts:[[CX+hw*0.74,CY-hh*0.65],[CX+hw*0.74,CY+hh*0.14],[CX+hw*0.2,CY+hh*0.14],[CX+hw*0.2,CY+hh*0.65]],col:'#0077ff'},
      {pts:[[CX-hw*0.54,CY+hh*0.65],[CX+hw*0.54,CY+hh*0.65]],col:'#00ffaa'},
      {pts:[[CX-hw*0.74,CY+hh*0.24],[CX-hw*0.4,CY+hh*0.24],[CX-hw*0.4,CY-hh*0.65]],col:'#7700ff'},
      {pts:[[CX+hw*0.4,CY-hh*0.65],[CX+hw*0.4,CY-hh*0.14],[CX+hw*0.74,CY-hh*0.14]],col:'#00aaff'},
      {pts:[[CX-hw*0.2,CY-hh*0.65],[CX+hw*0.2,CY-hh*0.65]],col:'#ff7700'},
      {pts:[[CX-hw*0.74,CY],[CX-hw*0.4,CY]],col:'#00f5ff'},
      {pts:[[CX+hw*0.4,CY+hh*0.42],[CX+hw*0.74,CY+hh*0.42]],col:'#0077ff'},
      {pts:[[CX-hw*0.54,CY-hh*0.4],[CX-hw*0.54,CY+hh*0.65]],col:'#00f5ff'},
      {pts:[[CX+hw*0.2,CY-hh*0.18],[CX+hw*0.54,CY-hh*0.18],[CX+hw*0.54,CY+hh*0.42]],col:'#7700ff'},
      {pts:[[CX-hw*0.2,CY+hh*0.14],[CX+hw*0.2,CY+hh*0.14]],col:'#00ffaa'},
      {pts:[[CX,CY-hh*0.65],[CX,CY-hh*0.4]],col:'#ff7700'},
      {pts:[[CX-hw*0.74,CY-hh*0.4],[CX-hw*0.54,CY-hh*0.4]],col:'#00aaff'},
    ]
    ROUTES.forEach(seg=>{
      // animated data packet running along each route
      const progress=(tick*0.35+ROUTES.indexOf(seg)*0.11)%1
      ctx.strokeStyle=rgba(seg.col,alpha*0.82)
      ctx.beginPath(); ctx.moveTo(seg.pts[0][0],seg.pts[0][1])
      for(let k=1;k<seg.pts.length;k++) ctx.lineTo(seg.pts[k][0],seg.pts[k][1])
      ctx.stroke()
      // moving data nub
      if(glow>0.6&&seg.pts.length>=2){
        const n=seg.pts.length-1, si=Math.min(Math.floor(progress*n),n-1)
        const f=progress*n-si
        const nx=lerp(seg.pts[si][0],seg.pts[si+1][0],f)
        const ny=lerp(seg.pts[si][1],seg.pts[si+1][1],f)
        ctx.beginPath(); ctx.arc(nx,ny,2.2,0,Math.PI*2)
        ctx.fillStyle=rgba(seg.col,alpha*0.9)
        ctx.shadowColor=seg.col; ctx.shadowBlur=10; ctx.fill()
      }
    })

    // ── 7. via nodes ───────────────────────────────────────────────────────
    const VIAS=[
      {x:CX-hw*0.74,y:CY-hh*0.65,r:3.8},{x:CX-hw*0.2,y:CY-hh*0.18,r:3.5},
      {x:CX-hw*0.2,y:CY+hh*0.44,r:3.5},{x:CX+hw*0.74,y:CY-hh*0.65,r:3.8},
      {x:CX+hw*0.2,y:CY+hh*0.14,r:3.5},{x:CX+hw*0.2,y:CY+hh*0.65,r:3.5},
      {x:CX-hw*0.54,y:CY+hh*0.65,r:3.5},{x:CX+hw*0.54,y:CY+hh*0.65,r:3.5},
      {x:CX-hw*0.74,y:CY+hh*0.24,r:3.5},{x:CX+hw*0.4,y:CY-hh*0.65,r:3.5},
      {x:CX+hw*0.74,y:CY-hh*0.14,r:3.5},{x:CX-hw*0.54,y:CY-hh*0.4,r:3.5},
      {x:CX+hw*0.54,y:CY-hh*0.18,r:3.5},
    ]
    VIAS.forEach(({x:vx,y:vy,r:vr},vi)=>{
      const p=0.6+0.4*Math.sin(tick*1.4+vi*0.75)
      ctx.beginPath(); ctx.arc(vx,vy,vr,0,Math.PI*2)
      ctx.fillStyle=`rgba(0,245,255,${alpha*p})`
      ctx.shadowColor='#00f5ff'; ctx.shadowBlur=glow*12; ctx.fill()
      // outer ring
      ctx.beginPath(); ctx.arc(vx,vy,vr+2.5,0,Math.PI*2)
      ctx.strokeStyle=`rgba(0,245,255,${alpha*p*0.35})`; ctx.lineWidth=0.7; ctx.stroke()
    })

    // ── 8. centre CPU die ──────────────────────────────────────────────────
    const dieS=hw*0.28
    // die body
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=glow*20
    const dieG=ctx.createRadialGradient(CX,CY,0,CX,CY,dieS*1.6)
    dieG.addColorStop(0,`rgba(0,180,255,${alpha*0.55})`)
    dieG.addColorStop(0.5,`rgba(0,80,200,${alpha*0.25})`)
    dieG.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=dieG; ctx.beginPath(); ctx.arc(CX,CY,dieS*1.6,0,Math.PI*2); ctx.fill()

    rc(CX-dieS,CY-dieS,dieS*2,dieS*2,4)
    const dieBody=ctx.createLinearGradient(CX-dieS,CY-dieS,CX+dieS,CY+dieS)
    dieBody.addColorStop(0,`rgba(0,60,140,${alpha*0.9})`)
    dieBody.addColorStop(1,`rgba(0,30,90,${alpha*0.9})`)
    ctx.fillStyle=dieBody; ctx.fill()
    ctx.strokeStyle=`rgba(0,245,255,${alpha})`; ctx.lineWidth=1.2; ctx.stroke()

    // die grid
    for(let g2=1;g2<4;g2++){
      const gp=CX-dieS+g2*(dieS*2/4)
      const gq=CY-dieS+g2*(dieS*2/4)
      ctx.strokeStyle=`rgba(0,200,255,${alpha*0.2})`; ctx.lineWidth=0.4
      ctx.beginPath(); ctx.moveTo(gp,CY-dieS); ctx.lineTo(gp,CY+dieS); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(CX-dieS,gq); ctx.lineTo(CX+dieS,gq); ctx.stroke()
    }

    // die scan bar
    const dieScan=(tick*dieS*1.1)%(dieS*2)
    const dsg=ctx.createLinearGradient(CX-dieS,CY-dieS+dieScan-2,CX-dieS,CY-dieS+dieScan+2)
    dsg.addColorStop(0,'rgba(0,255,255,0)')
    dsg.addColorStop(0.5,`rgba(0,255,255,${alpha*glow*0.5})`)
    dsg.addColorStop(1,'rgba(0,255,255,0)')
    ctx.fillStyle=dsg; ctx.fillRect(CX-dieS,CY-dieS+dieScan-2,dieS*2,4)

    // centre core dot
    const cp=0.7+0.3*Math.sin(tick*2.2)
    ctx.beginPath(); ctx.arc(CX,CY,5,0,Math.PI*2)
    ctx.fillStyle=`rgba(255,255,255,${alpha*cp})`
    ctx.shadowColor='#ffffff'; ctx.shadowBlur=glow*22; ctx.fill()

    // ── 9. 4 concentric aura rings ─────────────────────────────────────────
    ctx.shadowBlur=0
    for(let ring=0;ring<5;ring++){
      const rs=hw*(0.55+ring*0.2)
      const rp=(0.4+0.6*Math.sin(tick*0.55+ring*1.3))*alpha*0.15
      ctx.beginPath(); ctx.arc(CX,CY,rs,0,Math.PI*2)
      ctx.strokeStyle=`rgba(0,245,255,${rp})`
      ctx.lineWidth=ring===0?1.2:0.5; ctx.stroke()
    }

    // ── 10. corner bracket marks on chip face ──────────────────────────────
    const bOff=8, bLen=hw*0.22
    const corners=[[CX-hw+bOff,CY-hh+bOff],[CX+hw-bOff,CY-hh+bOff],[CX-hw+bOff,CY+hh-bOff],[CX+hw-bOff,CY+hh-bOff]]
    const dirs=[[[1,0],[0,1]],[[-1,0],[0,1]],[[1,0],[0,-1]],[[-1,0],[0,-1]]]
    ctx.strokeStyle=`rgba(0,245,255,${alpha*0.55})`; ctx.lineWidth=1.2
    corners.forEach(([cx2,cy2],ci)=>{
      const[[dx1,dy1],[dx2,dy2]]=dirs[ci]
      ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(cx2+dx1*bLen,cy2+dy1*bLen); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(cx2+dx2*bLen,cy2+dy2*bLen); ctx.stroke()
    })

    ctx.restore()
  }

  // ── background ────────────────────────────────────────────────────────────
  const drawBg=(raw,{W,H,CX,GROUND})=>{
    ctx.fillStyle='#000008'; ctx.fillRect(0,0,W,H)
    const ca=clamp(ph('build',raw)*0.7+ph('alive',raw)*0.5,0,1.2)
    if(ca>0.01){
      const g=ctx.createRadialGradient(CX,GROUND,0,CX,GROUND,W*0.7)
      g.addColorStop(0,`rgba(0,40,110,${ca*0.22})`); g.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H)
    }
  }

  // ── stars ─────────────────────────────────────────────────────────────────
  const drawStars=(raw,{W,H})=>{
    const a=1-clamp(ph('boot',raw)*2,0,1)
    if(a<0.01) return
    for(let i=0;i<130;i++){
      ctx.beginPath(); ctx.arc(rng(i*2.3)*W,rng(i*5.7)*H*0.42,0.8,0,Math.PI*2)
      ctx.fillStyle=`rgba(160,200,255,${a*(0.5+0.5*Math.sin(raw*12+i))*0.7})`; ctx.fill()
    }
  }

  // ── circuit traces (outward) ──────────────────────────────────────────────
  const drawTraces=(raw,{CX,CY})=>{
    let alpha
    if(active('surge',raw)) alpha=eOut(ph('surge',raw))
    else if(active('build',raw)||active('alive',raw)||active('hold',raw)) alpha=1
    else return
    TRACES.forEach(tr=>{
      const p=eOut(clamp((alpha-tr.delay*0.55)/0.72,0,1))
      if(p<0.01) return
      ctx.save(); ctx.shadowColor=tr.col; ctx.shadowBlur=10
      ctx.strokeStyle=rgba(tr.col,p*0.75); ctx.lineWidth=tr.w+0.5
      ctx.lineCap='round'; ctx.lineJoin='round'
      ctx.beginPath(); ctx.moveTo(CX+tr.pts[0].x,CY+tr.pts[0].y)
      tr.pts.slice(1).forEach(p2=>ctx.lineTo(CX+p2.x,CY+p2.y))
      ctx.stroke(); ctx.restore()
    })
  }

  // ── pulses ────────────────────────────────────────────────────────────────
  const drawPulses=raw=>{
    if(!active('surge',raw)&&!active('build',raw)&&!active('alive',raw)&&!active('hold',raw)) return
    PULSES.forEach(p=>{
      if(p.tr.pts.length<2) return
      const rel=ptOn(p.tr.pts,p.t)
      const pos={x:p.CX+rel.x,y:p.CY+rel.y}
      p.tail.push({...pos}); if(p.tail.length>20) p.tail.shift()
      ctx.save()
      p.tail.forEach((tp,i)=>{
        ctx.beginPath(); ctx.arc(tp.x,tp.y,p.r*(i/p.tail.length)*0.75,0,Math.PI*2)
        ctx.fillStyle=rgba(p.col,(i/p.tail.length)*0.45)
        ctx.shadowColor=p.col; ctx.shadowBlur=5; ctx.fill()
      })
      ctx.beginPath(); ctx.arc(pos.x,pos.y,p.r+1.5,0,Math.PI*2)
      ctx.fillStyle=rgba(p.col,0.95); ctx.shadowColor=p.col; ctx.shadowBlur=22; ctx.fill()
      ctx.restore(); p.t+=p.spd
    })
    for(let i=PULSES.length-1;i>=0;i--) if(PULSES[i].t>=1) PULSES.splice(i,1)
  }

  // ── buildings ─────────────────────────────────────────────────────────────
  const drawBuildings=(raw,tick,{CX,GROUND})=>{
    let prog,alpha
    if(active('build',raw)){prog=eOut(ph('build',raw),2.5);alpha=1}
    else if(active('alive',raw)){prog=1;alpha=1}
    else if(active('hold',raw)){prog=1;alpha=lerp(1,0.5,ph('hold',raw))}
    else return
    BUILDINGS.forEach((b,i)=>{
      const p=clamp((prog-b.delay)/(1-b.delay),0,1)
      if(p<0.01) return
      const h=b.h*eOut(p,3), bx=CX+b.ox-b.w/2, by=GROUND-h
      ctx.save(); ctx.shadowColor=b.col; ctx.shadowBlur=12
      const bg=ctx.createLinearGradient(bx,by,bx+b.w,by+h)
      bg.addColorStop(0,rgba(b.col,alpha*0.23)); bg.addColorStop(0.5,rgba(b.col,alpha*0.10)); bg.addColorStop(1,rgba(b.col,alpha*0.05))
      ctx.fillStyle=bg; ctx.fillRect(bx,by,b.w,h)
      ctx.strokeStyle=rgba(b.col,alpha*0.72); ctx.lineWidth=0.9; ctx.strokeRect(bx,by,b.w,h)
      if(b.w>20){
        ctx.strokeStyle=rgba(b.col,alpha*0.2); ctx.lineWidth=0.38
        ctx.beginPath(); ctx.moveTo(bx+b.w*0.35,by); ctx.lineTo(bx+b.w*0.35,by+h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(bx+b.w*0.7,by);  ctx.lineTo(bx+b.w*0.7,by+h);  ctx.stroke()
      }
      b.wins.forEach(({r,c,b:bright})=>{
        const wy=by+h-(r+1)*20+4, wx=bx+c*9+1.5
        if(wy<by||wy+14>by+h) return
        ctx.fillStyle=rgba(b.col,alpha*bright*0.55*(0.6+0.4*Math.sin(tick*1.1+bright*20)))
        ctx.fillRect(wx,wy,6,12)
      })
      if(b.hasTip&&p>0.82){
        const tp=clamp((p-0.82)/0.18,0,1)
        ctx.strokeStyle=rgba(b.col,alpha*tp); ctx.lineWidth=1.5
        ctx.beginPath(); ctx.moveTo(bx+b.w/2,by); ctx.lineTo(bx+b.w/2,by-b.tipH*tp); ctx.stroke()
        if(Math.sin(tick*3+i)>0.3){
          ctx.beginPath(); ctx.arc(bx+b.w/2,by-b.tipH*tp,2.5,0,Math.PI*2)
          ctx.fillStyle=`rgba(255,60,60,${alpha*tp})`; ctx.shadowColor='#ff3333'; ctx.shadowBlur=10; ctx.fill()
        }
      }
      if(p>0.94){
        const sy=by+((tick*36)%h)
        const sg=ctx.createLinearGradient(bx,sy-5,bx,sy+5)
        sg.addColorStop(0,'rgba(255,255,255,0)'); sg.addColorStop(0.5,rgba(b.col,alpha*0.18)); sg.addColorStop(1,'rgba(255,255,255,0)')
        ctx.fillStyle=sg; ctx.fillRect(bx,sy-5,b.w,10)
      }
      ctx.restore()
    })
  }

  // ── ground ────────────────────────────────────────────────────────────────
  const drawGround=(raw,{W,H,CX,GROUND})=>{
    const a=clamp(ph('build',raw)*3,0,1)
    if(a<0.01) return
    ctx.save()
    const grd=ctx.createLinearGradient(0,GROUND,0,H)
    grd.addColorStop(0,`rgba(0,245,255,${a*0.22})`); grd.addColorStop(0.15,`rgba(0,65,130,${a*0.20})`)
    grd.addColorStop(0.5,`rgba(0,22,55,${a*0.32})`); grd.addColorStop(1,`rgba(0,5,18,${a*0.92})`)
    ctx.fillStyle=grd; ctx.fillRect(0,GROUND,W,H-GROUND)
    ctx.strokeStyle=`rgba(0,245,255,${a*0.25})`; ctx.lineWidth=0.5
    for(let i=-15;i<=15;i++){
      ctx.beginPath(); ctx.moveTo(CX+i*52,GROUND); ctx.lineTo(CX+i*52*5,H+200); ctx.stroke()
    }
    for(let j=0;j<8;j++){
      const y=GROUND+j*32, ww=lerp(W,18,j/7)
      ctx.beginPath(); ctx.moveTo(CX-ww/2,y); ctx.lineTo(CX+ww/2,y); ctx.stroke()
    }
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=22*a
    ctx.strokeStyle=`rgba(0,245,255,${a*0.8})`; ctx.lineWidth=1.2
    ctx.beginPath(); ctx.moveTo(0,GROUND); ctx.lineTo(W,GROUND); ctx.stroke()
    ctx.restore()
  }

  // ── reflection ────────────────────────────────────────────────────────────
  const drawReflection=(raw,tick,g)=>{
    const a=clamp(ph('build',raw)*2-0.35,0,1)*0.15
    if(a<0.005) return
    ctx.save(); ctx.globalAlpha=a
    ctx.translate(0,g.GROUND*2); ctx.scale(1,-1); drawBuildings(raw,tick,g); ctx.restore()
  }

  // ── fog ───────────────────────────────────────────────────────────────────
  const drawFog=(raw,{W,GROUND})=>{
    const a=clamp(ph('build',raw)*2-0.22,0,0.88)
    if(a<0.01) return
    const fg=ctx.createLinearGradient(0,GROUND-60,0,GROUND+200)
    fg.addColorStop(0,'rgba(0,0,0,0)'); fg.addColorStop(0.22,`rgba(0,14,38,${a*0.38})`)
    fg.addColorStop(0.6,`rgba(0,10,30,${a*0.58})`); fg.addColorStop(1,`rgba(0,5,20,${a*0.85})`)
    ctx.fillStyle=fg; ctx.fillRect(0,GROUND-60,W,260)
  }

  // ── mega glow ─────────────────────────────────────────────────────────────
  const drawMegaGlow=(raw,{W,H,CX,CY})=>{
    const a=clamp(ph('alive',raw)*1.8,0,0.7)
    if(a<0.01) return
    const gr=ctx.createRadialGradient(CX,CY,0,CX,CY,W*0.65)
    gr.addColorStop(0,`rgba(0,110,255,${a*0.28})`); gr.addColorStop(0.3,`rgba(90,0,200,${a*0.10})`); gr.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=gr; ctx.fillRect(0,0,W,H)
  }

  // ── shockwave ─────────────────────────────────────────────────────────────
  const drawShockwave=(raw,{W,H,CX,CY})=>{
    if(!active('surge',raw)) return
    const p=eOut(ph('surge',raw),1.5)
    if(p<0.01||p>0.97) return
    const rad=p*W*0.65
    const wg=ctx.createRadialGradient(CX,CY,rad*0.78,CX,CY,rad)
    wg.addColorStop(0,'rgba(0,0,0,0)'); wg.addColorStop(0.65,`rgba(0,245,255,${(1-p)*0.45})`); wg.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle=wg; ctx.fillRect(0,0,W,H)
  }

  // ── SOFTCURSE SYSTEMS wordmark ─────────────────────────────────────────────
  const drawReveal=(raw,tick,{W,H,CX,CY})=>{
    if(!active('hold',raw)) return
    const hp=ph('hold',raw)
    // fast fade-in (first 20% of hold), stays full, no fade-out (canvas itself fades)
    const a=eOut(clamp(hp/0.2,0,1),2)
    if(a<0.005) return

    ctx.save()
    ctx.textAlign='center'; ctx.textBaseline='middle'

    const fz=Math.min(W*0.082,68)
    ctx.font=`900 ${fz}px 'Orbitron','Share Tech Mono',monospace`

    // glow layers
    ctx.shadowColor='#00f5ff'; ctx.shadowBlur=80*a
    ctx.fillStyle=`rgba(0,245,255,${a*0.14})`; ctx.fillText('SOFTCURSE SYSTEMS',CX,CY)
    ctx.shadowBlur=40*a
    ctx.fillStyle=`rgba(0,245,255,${a*0.28})`; ctx.fillText('SOFTCURSE SYSTEMS',CX,CY)
    ctx.shadowBlur=16*a
    ctx.fillStyle=`rgba(255,255,255,${a*0.94})`; ctx.fillText('SOFTCURSE SYSTEMS',CX,CY)

    // tagline
    const tz=Math.min(W*0.017,13)
    ctx.font=`400 ${tz}px 'Share Tech Mono',monospace`
    ctx.shadowBlur=10*a; ctx.fillStyle=`rgba(0,245,255,${a*0.75})`
    ctx.fillText('URBAN GENESIS ENGINE  //  v2025.ALPHA',CX,CY+fz*0.88)

    // ruled lines
    const rw=Math.min(W*0.48,390)
    const ry=CY-fz*0.72
    const lg=ctx.createLinearGradient(CX-rw/2,0,CX+rw/2,0)
    lg.addColorStop(0,'rgba(0,245,255,0)'); lg.addColorStop(0.5,`rgba(0,245,255,${a*0.6})`); lg.addColorStop(1,'rgba(0,245,255,0)')
    ctx.strokeStyle=lg; ctx.lineWidth=1; ctx.shadowBlur=0
    ctx.beginPath(); ctx.moveTo(CX-rw/2,ry); ctx.lineTo(CX+rw/2,ry); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(CX-rw/2,ry+fz*1.76); ctx.lineTo(CX+rw/2,ry+fz*1.76); ctx.stroke()

    ctx.restore()
  }

  // ── vignette ──────────────────────────────────────────────────────────────
  const drawVignette=({W,H,CX,CY})=>{
    const vg=ctx.createRadialGradient(CX,CY,W*0.18,CX,CY,W*0.78)
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,10,0.88)')
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H)
  }

  // ── RAF ───────────────────────────────────────────────────────────────────
  let startTs=null, rafId=null, stopped=false
  const frame=ts=>{
    if(stopped) return
    if(!startTs) startTs=ts
    const raw=Math.min((ts-startTs)/totalMs,1)
    const tick=ts/1000
    const g=geo()
    const {CX,CY}=g

    const inSurge=active('surge',raw), inBuild=active('build',raw)
    const inAlive=active('alive',raw)||active('hold',raw)
    const rate=inAlive?0.10:inBuild?0.20:inSurge?0.30:2
    if(Math.random()>rate) spawnPulse(CX,CY)

    drawBg(raw,g); drawStars(raw,g)
    drawMegaGlow(raw,g); drawShockwave(raw,g)
    drawGround(raw,g); drawTraces(raw,g); drawPulses(raw)
    drawBuildings(raw,tick,g); drawReflection(raw,tick,g); drawFog(raw,g)
    drawChip(raw,tick,g); drawVignette(g)
    drawReveal(raw,tick,g)

    ctx.globalAlpha=0.022
    for(let y=0;y<g.H;y+=2){ctx.fillStyle='#000';ctx.fillRect(0,y,g.W,1)}
    ctx.globalAlpha=1

    rafId=requestAnimationFrame(frame)
  }
  rafId=requestAnimationFrame(frame)
  return ()=>{ stopped=true; cancelAnimationFrame(rafId) }
}

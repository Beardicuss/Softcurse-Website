import { useEffect, useRef, useState } from 'react'

/**
 * Asteroids // Glitch
 * ─────────────────────────────────────────────────────────────
 * The hero's ambient particle field, now playable.
 * Uses real animated sprite frames for asteroids and ship.
 *
 * Idle:    ship auto-pilots gently, occasionally shooting.
 * Active:  WASD/Arrows to move, Space to fire, Click to aim+fire.
 */
export function useAsteroidsGlitch(active = true) {
    const canvasRef = useRef(null)
    const animRef = useRef(null)
    const [score, setScore] = useState(0)
    const [playing, setPlaying] = useState(false)
    const [lives, setLives] = useState(3)
    const [volume, setVolume] = useState(1.0)
    const stateRef = useRef({ playing: false, lives: 3, score: 0 })
    const volRef = useRef(1.0)

    useEffect(() => {
        volRef.current = volume
        // We ensure changes to the state instantly apply to the already-looping sound.
        if (typeof window !== 'undefined' && window.__shipIdleAudio) {
            window.__shipIdleAudio.volume = 1.0 * volume
        }
    }, [volume])

    useEffect(() => {
        if (!active) return
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        const CYAN = '#4ffff0'

        // ── Load sprite assets ──
        const loadImage = (src) => {
            const img = new Image()
            img.src = src
            return img
        }

        const shipNormalImg = loadImage('/assets/ship/normal/normal.webp')
        const shipInjuredImg = loadImage('/assets/ship/injured/injured.webp')
        const shipAttackImg = loadImage('/assets/ship/attack/attack.webp')

        // 8 frames of idle asteroid spin
        const asteroidIdleImgs = Array.from({ length: 8 }, (_, i) =>
            loadImage(`/assets/asteroid/idle/${i + 1}.webp`)
        )

        // 7 frames of asteroid destruction
        const asteroidDestroyImgs = Array.from({ length: 7 }, (_, i) =>
            loadImage(`/assets/asteroid/destroy/${i + 1}.webp`)
        )

        const SHIP_SIZE = 100
        const ASTEROID_SIZES = { large: 64, medium: 42, small: 26 }

        let particles = []
        let fragments = []
        let bullets = []
        let thrustParts = []
        let explosions = [] // now used for the destruction sprite animation
        let config = {}
        let frame = 0
        let lastInputT = 0
        let idleMode = true

        // ── Audio Engine ──
        const playSound = (src, baseVol = 0.5) => {
            if (volRef.current <= 0) return
            const a = new Audio(src)
            a.volume = baseVol * volRef.current
            a.play().catch(() => { })
        }
        const playFire = () => playSound('/assets/sounds/fire.wav', 0.1)
        const playCoin = () => playSound('/assets/sounds/coin_gain.wav', 0.5)
        const playDestroySmall = () => playSound('/assets/sounds/asteroid_destroyed_small.wav', 0.1)
        const playDestroyBig = () => playSound('/assets/sounds/asteroid_destroyed_big.wav', 0.1)

        window.__shipIdleAudio = window.__shipIdleAudio || new Audio('/assets/sounds/ship_idle.wav')
        const shipIdleAudio = window.__shipIdleAudio
        shipIdleAudio.loop = true
        shipIdleAudio.volume = 1 * volRef.current
        let engineSoundActive = false

        const ship = { x: 0, y: 0, angle: -Math.PI / 2, vx: 0, vy: 0, alive: true, blinkT: 0, shootT: 0 }
        const keys = {}

        // ── Responsive config ──
        const getConfig = (w) => {
            if (w < 600) return { COUNT: 30, FRAG: 3, LINK: 80, minR: 0.8, maxR: 1.6, minA: 0.25, maxA: 0.55, lineW: 0.5, lineAlpha: 0.2 }
            if (w < 1024) return { COUNT: 45, FRAG: 5, LINK: 100, minR: 1.0, maxR: 2.0, minA: 0.28, maxA: 0.60, lineW: 0.6, lineAlpha: 0.25 }
            return { COUNT: 65, FRAG: 6, LINK: 130, minR: 1.0, maxR: 3.0, minA: 0.3, maxA: 0.8, lineW: 0.8, lineAlpha: 0.35 }
        }

        const initField = (w, h) => {
            config = getConfig(w)
            particles = Array.from({ length: config.COUNT }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
                r: Math.random() * (config.maxR - config.minR) + config.minR,
                a: Math.random() * (config.maxA - config.minA) + config.minA,
            }))
            fragments = Array.from({ length: config.FRAG }, () => spawnFragment(w, h, 'large'))
            ship.x = w / 2; ship.y = h * 0.62
            ship.vx = 0; ship.vy = 0; ship.angle = -Math.PI / 2; ship.alive = true
        }

        const spawnFragment = (w, h, size) => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * (size === 'large' ? 0.6 : size === 'medium' ? 0.9 : 1.3),
            vy: (Math.random() - 0.5) * (size === 'large' ? 0.6 : size === 'medium' ? 0.9 : 1.3),
            size,
            r: ASTEROID_SIZES[size],
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.015,
            animFrame: Math.random() * 8, // Start at random animation frame
            hit: 0,
        })

        const spawnExplosion = (x, y, r) => {
            explosions.push({
                x, y,
                size: r * 2.5, // Draw burst slightly larger than the rock
                animFrame: 0,
                rot: Math.random() * Math.PI * 2
            })
        }

        const setSize = (w, h) => {
            if (!w || !h) return
            canvas.width = w; canvas.height = h
            initField(w, h)
        }

        // ── Input ──
        const onKeyDown = (e) => {
            keys[e.code] = true
            lastInputT = frame
            if (idleMode && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
                idleMode = false
                if (!stateRef.current.playing) startGame()
            }
            if (e.code === 'Space') { e.preventDefault(); fire() }
        }
        const onKeyUp = (e) => { keys[e.code] = false }

        const startGame = () => {
            stateRef.current.playing = true
            stateRef.current.lives = 3
            stateRef.current.score = 0
            ship.blinkT = 60
            ship.alive = true
            setPlaying(true); setLives(3); setScore(0)
        }

        const fire = () => {
            if (!ship.alive) return
            ship.shootT = 15 // Show attack frame for 15 frames
            playFire()
            bullets.push({
                x: ship.x + Math.cos(ship.angle) * 22,
                y: ship.y + Math.sin(ship.angle) * 22,
                vx: Math.cos(ship.angle) * 8 + ship.vx * 0.3,
                vy: Math.sin(ship.angle) * 8 + ship.vy * 0.3,
                life: 50,
            })
        }

        const onPointerDown = (e) => {
            if (e.target !== canvas) return
            const rect = canvas.getBoundingClientRect()
            const px = e.clientX - rect.left
            const py = e.clientY - rect.top
            lastInputT = frame

            if (idleMode) {
                idleMode = false
                if (!stateRef.current.playing) startGame()
            }

            if (ship.alive) {
                ship.angle = Math.atan2(py - ship.y, px - ship.x)
                fire()
            }
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        canvas.addEventListener('pointerdown', onPointerDown)

        // ── Idle auto-pilot ──
        const autoStep = (w, h) => {
            if (!ship.alive) return

            const cx = w * (0.3 + Math.sin(frame * 0.002) * 0.2)
            const cy = h * (0.35 + Math.cos(frame * 0.0015) * 0.15)
            const dx = cx - ship.x, dy = cy - ship.y
            const targetAngle = Math.atan2(dy, dx)
            let diff = targetAngle - ship.angle
            while (diff > Math.PI) diff -= Math.PI * 2
            while (diff < -Math.PI) diff += Math.PI * 2
            ship.angle += diff * 0.015

            ship.vx += Math.cos(ship.angle) * 0.015
            ship.vy += Math.sin(ship.angle) * 0.015
            ship.vx *= 0.997; ship.vy *= 0.997
            ship.x += ship.vx; ship.y += ship.vy
            if (ship.x < 0) ship.x = w; if (ship.x > w) ship.x = 0
            if (ship.y < 0) ship.y = h; if (ship.y > h) ship.y = 0

            if (frame % 6 === 0) {
                thrustParts.push({
                    x: ship.x - Math.cos(ship.angle) * 16 + (Math.random() - 0.5) * 4,
                    y: ship.y - Math.sin(ship.angle) * 16 + (Math.random() - 0.5) * 4,
                    life: 10 + Math.random() * 6, maxLife: 16,
                })
            }

            if (frame % 150 === 0) {
                let nearest = null, nearDist = Infinity
                for (const f of fragments) {
                    const d = Math.hypot(f.x - ship.x, f.y - ship.y)
                    if (d < nearDist) { nearDist = d; nearest = f }
                }
                if (nearest && nearDist < 300) {
                    ship.angle = Math.atan2(nearest.y - ship.y, nearest.x - ship.x)
                    fire()
                }
            }
        }

        // ── Player ship update ──
        const updateShip = (w, h) => {
            if (idleMode) { autoStep(w, h); return }
            if (!stateRef.current.playing || !ship.alive) return

            const THRUST = 0.15, FRICTION = 0.986, TURN = 0.065
            let thrusting = false

            if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= TURN
            if (keys['ArrowRight'] || keys['KeyD']) ship.angle += TURN
            if (keys['ArrowUp'] || keys['KeyW']) {
                ship.vx += Math.cos(ship.angle) * THRUST
                ship.vy += Math.sin(ship.angle) * THRUST
                thrusting = true
            }
            if (keys['ArrowDown'] || keys['KeyS']) {
                ship.vx -= Math.cos(ship.angle) * THRUST * 0.5
                ship.vy -= Math.sin(ship.angle) * THRUST * 0.5
            }

            if (thrusting && frame % 2 === 0) {
                thrustParts.push({
                    x: ship.x - Math.cos(ship.angle) * 18 + (Math.random() - 0.5) * 6,
                    y: ship.y - Math.sin(ship.angle) * 18 + (Math.random() - 0.5) * 6,
                    life: 12 + Math.random() * 8, maxLife: 20,
                })
            }

            ship.vx *= FRICTION; ship.vy *= FRICTION
            ship.x += ship.vx; ship.y += ship.vy
            if (ship.x < 0) ship.x = w; if (ship.x > w) ship.x = 0
            if (ship.y < 0) ship.y = h; if (ship.y > h) ship.y = 0

            // Auto-fallback to idle mode if no input for 5 sec (300 frames)
            if (frame - lastInputT > 300 && stateRef.current.playing) {
                idleMode = true
            }
        }

        const updateGameObjects = (w, h) => {
            // Fragments
            for (const f of fragments) {
                f.x += f.vx; f.y += f.vy; f.rot += f.vr
                f.animFrame = (f.animFrame + 0.08) % 8 // Cycle 8 idle frames
                if (f.x < -40) f.x = w + 40; if (f.x > w + 40) f.x = -40
                if (f.y < -40) f.y = h + 40; if (f.y > h + 40) f.y = -40
                if (f.hit > 0) f.hit--
            }

            for (const b of bullets) { b.x += b.vx; b.y += b.vy; b.life-- }
            bullets = bullets.filter(b => b.life > 0)

            for (const t of thrustParts) { t.life-- }
            thrustParts = thrustParts.filter(t => t.life > 0)

            // Animated explosions
            explosions = explosions.filter(e => e.animFrame < 7)
            for (const e of explosions) {
                e.animFrame += 0.25 // Play destruction animation fast
            }

            // Bullet vs fragment
            for (let fi = 0; fi < fragments.length; fi++) {
                const f = fragments[fi]
                for (const b of bullets) {
                    if (b.life <= 0) continue
                    const d = Math.hypot(f.x - b.x, f.y - b.y)
                    if (d < f.r * 0.7) {
                        b.life = 0

                        // Spawn animated destruction sequence
                        spawnExplosion(f.x, f.y, f.r)
                        if (f.size === 'small') playDestroySmall()
                        else playDestroyBig()

                        // Split into smaller pieces
                        if (f.size === 'large') {
                            for (let s = 0; s < 2; s++) {
                                const a = Math.random() * Math.PI * 2
                                const nf = spawnFragment(w, h, 'medium')
                                nf.x = f.x + Math.cos(a) * 16; nf.y = f.y + Math.sin(a) * 16
                                nf.vx = Math.cos(a) * (0.6 + Math.random() * 0.6)
                                nf.vy = Math.sin(a) * (0.6 + Math.random() * 0.6)
                                nf.hit = 5
                                fragments.push(nf)
                            }
                        } else if (f.size === 'medium') {
                            for (let s = 0; s < 2; s++) {
                                const a = Math.random() * Math.PI * 2
                                const nf = spawnFragment(w, h, 'small')
                                nf.x = f.x + Math.cos(a) * 10; nf.y = f.y + Math.sin(a) * 10
                                nf.vx = Math.cos(a) * (0.8 + Math.random() * 0.8)
                                nf.vy = Math.sin(a) * (0.8 + Math.random() * 0.8)
                                nf.hit = 4
                                fragments.push(nf)
                            }
                        }

                        fragments.splice(fi, 1); fi--

                        // Schedule a new big asteroid to spawn
                        setTimeout(() => {
                            if (fragments.length < config.FRAG + 4) {
                                const edge = Math.floor(Math.random() * 4)
                                const nf = spawnFragment(w, h, 'large')
                                nf.x = edge === 0 ? -30 : edge === 1 ? w + 30 : Math.random() * w
                                nf.y = edge === 2 ? -30 : edge === 3 ? h + 30 : Math.random() * h
                                fragments.push(nf)
                            }
                        }, 3000 + Math.random() * 3000)

                        if (stateRef.current.playing) {
                            const pts = f.size === 'large' ? 20 : f.size === 'medium' ? 50 : 100
                            stateRef.current.score += pts
                            setScore(stateRef.current.score)

                            // Every 1000 points get an extra life
                            if (stateRef.current.score % 1000 === 0 || (pts === 100 && Math.random() < 0.2)) {
                                playCoin()
                            }
                        }
                        break
                    }
                }
            }

            // Ship vs fragment
            if (stateRef.current.playing && ship.alive && ship.blinkT <= 0) {
                for (const f of fragments) {
                    const d = Math.hypot(f.x - ship.x, f.y - ship.y)
                    if (d < f.r * 0.5 + SHIP_SIZE * 0.3) {
                        stateRef.current.lives -= 1
                        setLives(stateRef.current.lives)
                        ship.blinkT = 120
                        ship.vx *= 0.2; ship.vy *= 0.2

                        // Re-use destruction animation for ship explosion (looks cool)
                        spawnExplosion(ship.x, ship.y, SHIP_SIZE)

                        if (stateRef.current.lives <= 0) {
                            ship.alive = false
                            stateRef.current.playing = false
                            setPlaying(false)
                            idleMode = true
                            setTimeout(() => {
                                ship.alive = true
                                ship.x = canvas.width / 2; ship.y = canvas.height * 0.62
                                ship.vx = 0; ship.vy = 0; ship.angle = -Math.PI / 2
                            }, 2000)
                        }
                        break
                    }
                }
            }
            if (ship.blinkT > 0) ship.blinkT--
            if (ship.shootT > 0) ship.shootT--
        }

        // ═══════════════════════════════════════════
        //  DRAW
        // ═══════════════════════════════════════════

        const draw = () => {
            const { width: w, height: h } = canvas
            if (!w || !h) { animRef.current = requestAnimationFrame(draw); return }

            // Do not run game loop during BootScreen video
            if (typeof window !== 'undefined' && !window.__SITE_BOOTED) {
                animRef.current = requestAnimationFrame(draw)
                return
            }

            // 5 second auto-start if game over
            if (!stateRef.current.playing && frame - lastInputT > 300) {
                startGame()
                idleMode = true
            }

            // Audio Engine Sync
            const shouldPlayEngine = stateRef.current.playing && ship.alive && !idleMode
            if (shouldPlayEngine && !engineSoundActive) {
                shipIdleAudio.play().catch(() => { })
                engineSoundActive = true
            } else if (!shouldPlayEngine && engineSoundActive) {
                shipIdleAudio.pause()
                engineSoundActive = false
            }

            frame++

            try {
                ctx.clearRect(0, 0, w, h)

                if (!prefersReduced) {
                    updateShip(w, h)
                    updateGameObjects(w, h)
                }

                // Constellation connections
                const LINK_SQ = config.LINK * config.LINK
                for (let i = 0; i < particles.length; i++) {
                    const pi = particles[i]
                    for (let j = i + 1; j < particles.length; j++) {
                        const pj = particles[j]
                        const dx = pi.x - pj.x, dy = pi.y - pj.y
                        const dSq = dx * dx + dy * dy
                        if (dSq < LINK_SQ) {
                            ctx.globalAlpha = Math.min(1, (1 - dSq / LINK_SQ) * config.lineAlpha)
                            ctx.strokeStyle = CYAN
                            ctx.lineWidth = config.lineW
                            ctx.beginPath(); ctx.moveTo(pi.x, pi.y); ctx.lineTo(pj.x, pj.y); ctx.stroke()
                        }
                    }
                }

                // Ambient particles
                for (const p of particles) {
                    if (!prefersReduced) {
                        p.x += p.vx; p.y += p.vy
                        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
                        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
                    }
                    ctx.globalAlpha = p.a
                    ctx.fillStyle = CYAN
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
                }

                // Thrust particles
                for (const t of thrustParts) {
                    const ratio = t.life / t.maxLife
                    ctx.globalAlpha = ratio * 0.5
                    ctx.fillStyle = CYAN
                    ctx.shadowColor = CYAN
                    ctx.shadowBlur = 6
                    ctx.beginPath(); ctx.arc(t.x, t.y, ratio * 3, 0, Math.PI * 2); ctx.fill()
                }
                ctx.shadowBlur = 0

                // Animated Explosions
                for (const e of explosions) {
                    const fIdx = Math.floor(e.animFrame)
                    if (fIdx >= 0 && fIdx < 7) {
                        const expImg = asteroidDestroyImgs[fIdx]
                        if (expImg && expImg.complete) {
                            ctx.save()
                            ctx.translate(e.x, e.y)
                            ctx.rotate(e.rot)
                            ctx.globalAlpha = 0.95
                            ctx.drawImage(expImg, -e.size / 2, -e.size / 2, e.size, e.size)

                            // Glow
                            ctx.globalCompositeOperation = 'lighter'
                            ctx.globalAlpha = 0.5
                            ctx.drawImage(expImg, -e.size / 2, -e.size / 2, e.size, e.size)
                            ctx.restore()
                        }
                    }
                }

                // Asteroids (animated frames)
                for (const f of fragments) {
                    ctx.save()
                    ctx.translate(f.x, f.y)
                    ctx.rotate(f.rot)
                    const sz = f.r * 2
                    ctx.globalAlpha = f.hit > 0 ? 1 : 0.85

                    const fIdx = Math.floor(f.animFrame) % 8
                    const img = asteroidIdleImgs[fIdx]

                    if (img && img.complete) {
                        ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz)
                        // Flash white/cyan
                        if (f.hit > 0) {
                            ctx.globalCompositeOperation = 'lighter'
                            ctx.globalAlpha = f.hit / 5
                            ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz)
                        }
                    }
                    ctx.restore()
                }

                // Bullets
                ctx.shadowColor = CYAN
                ctx.shadowBlur = 10
                for (const b of bullets) {
                    ctx.globalAlpha = Math.min(1, b.life / 15)
                    ctx.fillStyle = CYAN
                    ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2); ctx.fill()
                }
                ctx.shadowBlur = 0
                ctx.globalAlpha = 1

                // Ship (sprite)
                if (ship.alive) {
                    ctx.save()
                    ctx.translate(ship.x, ship.y)
                    ctx.rotate(ship.angle + Math.PI / 2)

                    let currentImg = shipNormalImg
                    if (ship.blinkT > 0) {
                        currentImg = shipInjuredImg
                        ctx.globalAlpha = (frame % 8 < 4) ? 0.6 : 1 // slight injured blink
                    } else if (ship.shootT > 0) {
                        currentImg = shipAttackImg
                    }

                    if (currentImg && currentImg.complete) {
                        ctx.drawImage(currentImg, -SHIP_SIZE / 2, -SHIP_SIZE / 2, SHIP_SIZE, SHIP_SIZE)

                        // Subtle cyan glow behind ship
                        ctx.globalCompositeOperation = 'lighter'
                        ctx.globalAlpha = (ship.blinkT > 0) ? 0.1 : 0.25
                        ctx.shadowColor = CYAN
                        ctx.shadowBlur = 15
                        ctx.drawImage(currentImg, -SHIP_SIZE / 2, -SHIP_SIZE / 2, SHIP_SIZE, SHIP_SIZE)
                    }
                    ctx.restore()
                    ctx.shadowBlur = 0
                }

                // Score HUD
                if (stateRef.current.playing) {
                    ctx.globalAlpha = 0.45
                    ctx.font = '11px "JetBrains Mono", monospace'
                    ctx.fillStyle = CYAN
                    ctx.textAlign = 'left'
                    ctx.fillText(`SCR ${String(stateRef.current.score).padStart(5, '0')}`, 16, 28)
                    for (let i = 0; i < stateRef.current.lives; i++) {
                        if (shipNormalImg && shipNormalImg.complete) {
                            ctx.globalAlpha = 0.5
                            ctx.drawImage(shipNormalImg, 14 + i * 18, 34, 14, 14)
                        }
                    }
                    ctx.globalAlpha = 1
                }
            } catch (err) {
                // ctx.fillStyle = 'red'
                // ctx.font = '20px monospace'
                // ctx.fillText(`Error: ${err.message}`, 40, 80)
                console.error(err)
            }

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
            if (!canvas.width || !canvas.height) setSize(canvas.offsetWidth, canvas.offsetHeight)
        })

        draw()

        return () => {
            cancelAnimationFrame(animRef.current)
            shipIdleAudio.pause()
            ro.disconnect()
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
            canvas.removeEventListener('pointerdown', onPointerDown)
        }
    }, [active])

    return { canvasRef, score, playing, lives, volume, setVolume }
}

import { useParticles } from '../hooks/useParticles'
import { usePageTitle } from '../hooks/usePageTitle'
import { getApps } from '../data/apps'
import { getGames } from '../data/games'
import AppCard from '../components/common/AppCard'
import GameCard from '../components/common/GameCard'
import Button from '../components/common/Button'
import Newsletter from '../components/common/Newsletter'
import styles from './Home.module.css'

export default function Home() {
  usePageTitle(null) // just "SOFTCURSE" on homepage
  const canvasRef = useParticles(true)
  const apps  = getApps().slice(0, 6)
  const games = getGames()

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={`${styles.hero} grid-bg`}>
        <div className="scanline" />
        <canvas ref={canvasRef} className={styles.canvas} />

        <div className={`${styles.heroInner} anim-fade-up`}>
          <div className={styles.eyebrow}>// DIGITAL UNIVERSE INITIALIZED</div>
          <h1 className={`${styles.heroTitle} anim-glow`}>SOFTCURSE</h1>
          <div className={styles.heroSub}>LABS · STUDIO · SYSTEMS</div>
          <p className={styles.heroDesc}>
            A small, slightly sinister digital universe. Building tools that pierce the noise —
            and worlds that bend reality.
          </p>
          <div className={styles.heroCta}>
            <Button variant="cyan" href="/lab">ENTER THE LAB</Button>
            <Button variant="outline" href="/studio">EXPLORE STUDIO</Button>
          </div>
        </div>

        {/* Scroll cue */}
        <div className={styles.scrollCue}>
          <span className={styles.scrollLine} />
          <span className={styles.scrollLabel}>SCROLL</span>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className={styles.stats}>
        {[
          ['9',  'Lab Tools'],
          ['3',  'Games in Dev'],
          ['∞',  'Possibilities'],
          ['1',  'Universe'],
        ].map(([n, l]) => (
          <div key={l} className={styles.stat}>
            <span className={styles.statN}>{n}</span>
            <span className={styles.statL}>{l}</span>
          </div>
        ))}
      </div>

      {/* ── Lab Preview ── */}
      <section className={`${styles.section} container`}>
        <div className="sec-header">
          <div className="sec-header__label">// MODULE 01</div>
          <h2 className="sec-header__title">
            SOFTCURSE <span className="text-cyan">LAB</span>
          </h2>
          <p className="sec-header__desc">
            Tools forged in the dark. Each one built to solve exactly what it claims
            to solve — nothing more, nothing less.
          </p>
        </div>
        <div className="card-grid">
          {apps.map(a => <AppCard key={a.id} app={a} />)}
        </div>
        <div className={styles.sectionCta}>
          <Button variant="outline" href="/lab">VIEW ALL TOOLS →</Button>
        </div>
      </section>

      <div className={styles.dividerWrap}>
        <div className="divider" />
      </div>

      {/* ── Studio Preview ── */}
      <section className={`${styles.section} ${styles.studioSection} container`}>
        <div className="sec-header">
          <div className="sec-header__label sec-header__label--magenta">// MODULE 02</div>
          <h2 className="sec-header__title">
            SOFTCURSE <span className="text-magenta">STUDIO</span>
          </h2>
          <p className="sec-header__desc">
            Worlds that don't forgive. Stories that stay with you. Games built from
            the ground up with intent.
          </p>
        </div>
        <div className="card-grid">
          {games.map(g => <GameCard key={g.id} game={g} />)}
        </div>
        <div className={styles.sectionCta}>
          <Button variant="outlineMagenta" href="/studio">VIEW ALL GAMES →</Button>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <div className={styles.newsletterWrapper}>
        <div className="container">
          <Newsletter />
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <h2 className={styles.ctaTitle}>BUILT IN THE DARK. SHIPPED WITH PURPOSE.</h2>
          <p className={styles.ctaDesc}>
            Softcurse is always building. Follow the blog for development updates
            or reach out to collaborate.
          </p>
          <div className={styles.ctaBtns}>
            <Button variant="cyan" href="/blog">READ THE BLOG</Button>
            <Button variant="outlineMagenta" href="/contact">GET IN TOUCH</Button>
          </div>
        </div>
      </div>

    </div>
  )
}

import { useParams, Link, Navigate } from 'react-router-dom'
import { GAMES } from '../../data/games'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import styles from './GameDetail.module.css'

export default function GameDetail() {
  const { id } = useParams()
  const game = GAMES[id]
  if (!game) return <Navigate to="/studio" replace />

  usePageTitle(game.name)
  useSEO({
    title: game.name,
    description: game.shortDesc + ' — A Softcurse Studio game. ' + game.genre + ' for ' + (game.platforms || []).join(', '),
    url: `/studio/${game.id}`,
    image: game.image || undefined,
  })

  const [heroRef, heroVis] = useScrollReveal(0.05)
  const [featRef, featVis] = useScrollReveal()
  const [blogRef, blogVis] = useScrollReveal()

  const statusLabel = { active: '● LIVE', beta: '⬡ BETA', dev: '◎ IN DEV', planned: '○ PLANNED' }

  return (
    <div className={styles.page}>

      {/* ── HERO BANNER ── */}
      <div className={styles.hero} ref={heroRef}>
        {game.image
          ? <img src={game.image} alt={game.name} className={styles.heroImg} loading="lazy" decoding="async" />
          : <div className={styles.heroPlaceholder}><span className={styles.heroIcon}>{game.icon}</span></div>
        }
        <div className={styles.heroOverlay} />
        <div className={`${styles.heroContent} ${heroVis ? styles.heroVisible : ''}`}>
          <div className={styles.heroBadges}>
            <Badge status={game.status} />
            <span className={styles.heroTag}>{game.genre}</span>
            <span className={styles.heroTag}>{game.platforms?.join(' · ')}</span>
            {game.engine && <span className={styles.heroEngine}>{game.engine}</span>}
          </div>
          <h1 className={styles.heroTitle}>{game.name}</h1>
          <p className={styles.heroDesc}>{game.shortDesc}</p>
          <div className={styles.heroActions}>
            {game.playUrl && <Button variant="cyan" external={game.playUrl}>▶ PLAY NOW</Button>}
            {!game.playUrl && <Button variant="magenta">WISHLIST</Button>}
            <Button variant="ghost" href="/studio">← BACK TO STUDIO</Button>
          </div>
        </div>
      </div>

      <div className="container--narrow">

        {/* ── DESCRIPTION ── */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>// ABOUT THE GAME</div>
          <p className={styles.desc}>{game.desc}</p>
        </section>

        {/* ── FEATURES ── */}
        <section className={`${styles.section}`} ref={featRef}>
          <div className={styles.sectionLabel}>// FEATURES</div>
          <h2 className={styles.sectionTitle}>What to expect</h2>
          <ul className={`${styles.featGrid} reveal-group ${featVis ? 'visible' : ''}`}>
            {game.features.map((f, i) => (
              <li key={i} className={styles.featItem}>
                <span className={styles.featCheck}>▸</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── META ROW ── */}
        <section className={styles.metaSection}>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>STATUS</span>
            <span className={`${styles.metaVal} ${styles[game.status]}`}>{statusLabel[game.status]}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>GENRE</span>
            <span className={styles.metaVal}>{game.genre}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>PLATFORM</span>
            <span className={styles.metaVal}>{game.platforms?.join(', ')}</span>
          </div>
          {game.engine && (
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>ENGINE</span>
              <span className={styles.metaVal}>{game.engine}</span>
            </div>
          )}
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>RELEASE</span>
            <span className={styles.metaVal}>{game.releaseDate || 'TBA'}</span>
          </div>
          {game.version && (
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>BUILD</span>
              <span className={styles.metaVal}>{game.version}</span>
            </div>
          )}
        </section>

        {/* ── DEV BLOG ── */}
        {game.devBlog?.length > 0 && (
          <section className={`${styles.section} reveal ${blogVis ? 'visible' : ''}`} ref={blogRef}>
            <div className={styles.sectionLabel}>// DEV LOG</div>
            <h2 className={styles.sectionTitle}>From the build</h2>
            <div className={styles.devBlog}>
              {game.devBlog.map(post => (
                <Link to="/blog" key={post.date} className={styles.devPost}>
                  <span className={styles.devDate}>{post.date}</span>
                  <div className={styles.devBody}>
                    <span className={styles.devTitle}>{post.title}</span>
                    <span className={styles.devExc}>{post.excerpt}</span>
                  </div>
                  <span className={styles.devArrow}>→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <div className={styles.cta}>
          {game.playUrl
            ? <Button variant="cyan" external={game.playUrl}>▶ PLAY NOW</Button>
            : <Button variant="magenta">WISHLIST THIS GAME</Button>
          }
          <Button variant="outlineMagenta" href="/blog">DEV BLOG</Button>
        </div>

      </div>
    </div>
  )
}

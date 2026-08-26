import { Link } from 'react-router-dom'
import { GAMES } from '../../data/games'
import { useCmsItems } from '../../content/CmsContent'
import { useSEO } from '../../hooks/useSEO'
import GameCard from '../../components/common/GameCard'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from './Studio.module.css'

export default function Studio() {
  useSEO({ title: 'Studio Games', description: 'Original games from Softcurse Studio — playable releases and worlds in development.', url: '/studio/games' })
  usePageTitle('Studio Games')
  const games = useCmsItems('game', Object.values(GAMES))

  return (
    <div>
      <div className={`page-header grid-bg ${styles.header}`}>
        <div className="scanline" />
        <div className="page-header__eyebrow" style={{ color: 'var(--magenta)' }}>{"// SOFTCURSE"}</div>
        <h1 className="page-header__title page-header__title--magenta">GAMES</h1>
        <p className="page-header__desc">
          Original worlds, each built from a different kind of dark. Some are live now;
          the rest ship when they&apos;re right. No compromises.
        </p>
      </div>

      <div className="container section">
        <div className="card-grid">
          {games.map(g => <GameCard key={g.id} game={g} />)}
        </div>

        <div className={styles.note}>
          <span className={styles.noteLabel}>{"// STUDIO NOTE"}</span>
          <p className={styles.noteText}>
            Softcurse Studio games range from playable browser releases to worlds in development.
            Follow the <Link to="/blog">blog</Link> for dev updates, media drops, and lore reveals.
            No ETAs. Just progress.
          </p>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { getGames } from '../../data/games'
import { useSEO } from '../../hooks/useSEO'
import GameCard from '../../components/common/GameCard'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from './Studio.module.css'

export default function Studio() {
  useSEO({ title: 'Studio', description: 'Softcurse Studio — worlds that never forgive. Stories that linger. Built from the ground up with intent.', url: '/studio' })
  usePageTitle('The Studio')
  const games = getGames()

  return (
    <div>
      <div className={`page-header grid-bg ${styles.header}`}>
        <div className="scanline" />
        <div className="page-header__eyebrow" style={{ color: 'var(--magenta)' }}>// SOFTCURSE</div>
        <h1 className="page-header__title page-header__title--magenta">THE STUDIO</h1>
        <p className="page-header__desc">
          Three worlds under construction. Each one built from a different kind of dark.
          No release dates. No compromises. Shipped when they're right.
        </p>
      </div>

      <div className="container section">
        <div className="card-grid">
          {games.map(g => <GameCard key={g.id} game={g} />)}
        </div>

        <div className={styles.note}>
          <span className={styles.noteLabel}>// STUDIO NOTE</span>
          <p className={styles.noteText}>
            All Softcurse Studio games are in active or planned development.
            Follow the <Link to="/blog">blog</Link> for dev updates, media drops, and lore reveals.
            No ETAs. Just progress.
          </p>
        </div>
      </div>
    </div>
  )
}

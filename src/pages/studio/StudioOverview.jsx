import { Link } from 'react-router-dom'
import { GAMES } from '../../data/games'
import { CHRONICLES } from '../../data/chronicles'
import { useCmsItems } from '../../content/CmsContent'
import { useSEO } from '../../hooks/useSEO'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from '../ModuleOverview.module.css'

export default function StudioOverview() {
  const gameCount = useCmsItems('game', Object.values(GAMES)).length
  const chronicleCount = useCmsItems('chronicle', Object.values(CHRONICLES)).length

  useSEO({
    title: 'The Studio',
    description: 'Softcurse Studio — original games, interactive worlds, and serialized chronicles.',
    url: '/studio',
  })
  usePageTitle('The Studio')

  return (
    <div>
      <header className={`page-header grid-bg ${styles.studioHeader}`}>
        <div className="scanline" />
        <div className="page-header__eyebrow" style={{ color: 'var(--magenta)' }}>{'// MODULE DIRECTORY'}</div>
        <h1 className="page-header__title page-header__title--magenta">THE STUDIO</h1>
        <p className="page-header__desc">
          Original games and story worlds from Softcurse. Choose the form you want to enter.
        </p>
      </header>

      <section className={`container section ${styles.grid}`} aria-label="Studio sections">
        <Link to="/studio/games" className={`${styles.card} ${styles.magenta}`}>
          <span className={styles.index}>01</span>
          <span className={styles.eyebrow}>INTERACTIVE</span>
          <h2>GAMES</h2>
          <p>Playable releases and original worlds currently in development.</p>
          <span className={styles.meta}>{gameCount} WORLDS <b>EXPLORE →</b></span>
        </Link>

        <Link to="/chronicles" className={`${styles.card} ${styles.magenta}`}>
          <span className={styles.index}>02</span>
          <span className={styles.eyebrow}>SERIAL FICTION</span>
          <h2>CHRONICLES</h2>
          <p>Long-form stories, field records, and darker corners of the Softcurse universe.</p>
          <span className={styles.meta}>{chronicleCount} SERIES <b>READ →</b></span>
        </Link>
      </section>
    </div>
  )
}

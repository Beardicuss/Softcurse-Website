import { Link } from 'react-router-dom'
import { getApps } from '../../data/apps'
import { getGames } from '../../data/games'
import styles from './Footer.module.css'

export default function Footer() {
  const apps  = getApps()
  const games = getGames()
  const year  = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="Softcurse" className={styles.footerLogo} />
            SOFTCURSE
          </div>
          <p className={styles.tagline}>
            A small, slightly sinister digital universe. Tools. Games. Systems.
          </p>
        </div>

        {/* Lab links */}
        <div>
          <div className={styles.colTitle}>Lab</div>
          <ul className={styles.colLinks}>
            {apps.map(a => (
              <li key={a.id}>
                <Link to={`/lab/${a.id}`} className={styles.colLink}>{a.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Studio links */}
        <div>
          <div className={styles.colTitle}>Studio</div>
          <ul className={styles.colLinks}>
            {games.map(g => (
              <li key={g.id}>
                <Link to={`/studio/${g.id}`} className={styles.colLink}>{g.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <div>
          <div className={styles.colTitle}>Navigate</div>
          <ul className={styles.colLinks}>
            {[
              ['/', 'Home'],
              ['/lab', 'Lab'],
              ['/studio', 'Studio'],
              ['/about', 'About'],
              ['/contact', 'Contact'],
              ['/blog', 'Blog'],
              ['/roadmap', 'Roadmap'],
              ['/press', 'Press Kit'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className={styles.colLink}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <span className={styles.copy}>
          © {year} SOFTCURSE. ALL RIGHTS RESERVED. NO CURSE WAIVED.
        </span>
        <span className={styles.build}>BUILD: SC-{year}.ALPHA</span>
      </div>
    </footer>
  )
}

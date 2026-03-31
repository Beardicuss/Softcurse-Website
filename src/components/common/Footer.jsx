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

      {/* Hex grid top border */}
      <div className={styles.topBorder} />

      <div className={styles.inner}>

        {/* Brand column */}
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            <img src="/logo.png" alt="" className={styles.logoImg} />
            <span>SOFTCURSE</span>
          </Link>
          <p className={styles.tagline}>
            A small, slightly sinister digital universe.<br />
            Tools that pierce the noise.<br />
            Worlds that bend reality.
          </p>

          {/* Status indicator */}
          <div className={styles.statusRow}>
            <span className={styles.statusDot} />
            <span className={styles.statusText}>ALL SYSTEMS OPERATIONAL</span>
          </div>

          {/* Socials */}
          <div className={styles.socials}>
            {[
              { label: 'GitHub',   href: 'https://github.com/Beardicuss' },
              { label: 'Twitter',  href: '#' },
              { label: 'Discord',  href: '#' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className={styles.social}
                 target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Lab */}
        <div>
          <div className={styles.colHead}>
            <span className={styles.colAccent}>◈</span> LAB
          </div>
          <ul className={styles.colList}>
            <li><Link to="/lab" className={styles.colLink}>All Tools</Link>
            <li><Link to="/experiments" className={styles.colLink}>Experiments</Link></li></li>
            {apps.map(a => (
              <li key={a.id}>
                <Link to={`/lab/${a.id}`} className={styles.colLink}>
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Studio */}
        <div>
          <div className={`${styles.colHead} ${styles.colHeadMagenta}`}>
            <span className={styles.colAccentMagenta}>◈</span> STUDIO
          </div>
          <ul className={styles.colList}>
            <li><Link to="/studio" className={styles.colLink}>All Games</Link>
            <li><Link to="/chronicles" className={styles.colLink}>Chronicles</Link></li></li>
            {games.map(g => (
              <li key={g.id}>
                <Link to={`/studio/${g.id}`} className={styles.colLink}>
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Navigate */}
        <div>
          <div className={styles.colHead}>
            <span className={styles.colAccent}>◈</span> NAVIGATE
          </div>
          <ul className={styles.colList}>
            {[
              ['/about',   'About'],
              ['/contact', 'Contact'],
              ['/blog',    'Blog'],
              ['/roadmap', 'Roadmap'],
              ['/press',   'Press Kit'],
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
        <div className={styles.bottomLeft}>
          <span className={styles.buildTag}>BUILD // SC-{year}.PROD</span>
          <span className={styles.sep}>·</span>
          <span className={styles.buildTag}>NODE: EARTH-01</span>
          <span className={styles.sep}>·</span>
          <span className={styles.buildTag}>UPTIME: ∞</span>
        </div>
        <div className={styles.copy}>
          © {year} SOFTCURSE — NO CURSE WAIVED.
        </div>
      </div>

    </footer>
  )
}

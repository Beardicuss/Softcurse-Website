import { Link } from 'react-router-dom'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { withBreadcrumbs } from '../../utils/seoSchemas'
import styles from './HexbrewersRulebook.module.css'

const RULEBOOK_URL = '/rulebooks/hexbrewers/index.html'

export default function HexbrewersRulebook() {
  usePageTitle("The Hexbrewer's Codex")
  useSEO({
    title: "The Hexbrewer's Codex — Official HexBrewers Rulebook",
    description: 'Read the complete illustrated and interactive rules for HexBrewers from Ashenveil in English, Georgian, or Russian.',
    url: '/studio/hexbrewers/rulebook',
    type: 'article',
    structuredData: withBreadcrumbs({
      '@type': 'HowTo',
      name: "The Hexbrewer's Codex",
      description: 'The complete illustrated rules for HexBrewers from Ashenveil.',
      inLanguage: ['en', 'ka', 'ru'],
      author: { '@type': 'Organization', name: 'Softcurse Systems' },
      publisher: { '@type': 'Organization', name: 'Softcurse Systems' },
    }, [
      { name: 'Home', path: '/' },
      { name: 'Studio Games', path: '/studio/games' },
      { name: 'HexBrewers from Ashenveil', path: '/studio/hexbrewers' },
      { name: "The Hexbrewer's Codex", path: '/studio/hexbrewers/rulebook' },
    ]),
  })

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Link to="/studio/hexbrewers" className={styles.back}>← HEXBREWERS</Link>
        <div>
          <span className={styles.eyebrow}>OFFICIAL RULEBOOK</span>
          <strong>THE HEXBREWER&apos;S CODEX</strong>
        </div>
        <a href={RULEBOOK_URL} target="_blank" rel="noopener noreferrer" className={styles.external}>
          OPEN FULL SCREEN ↗
        </a>
      </div>
      <iframe
        className={styles.frame}
        src={RULEBOOK_URL}
        title="The Hexbrewer's Codex — interactive HexBrewers rulebook"
        loading="eager"
      />
    </div>
  )
}

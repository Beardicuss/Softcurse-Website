import { Link } from 'react-router-dom'
import { APPS } from '../../data/apps'
import { EXPERIMENTS } from '../../data/experiments'
import { useCmsItems } from '../../content/CmsContent'
import { useSEO } from '../../hooks/useSEO'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from '../ModuleOverview.module.css'

export default function LabOverview() {
  const appCount = useCmsItems('app', Object.values(APPS)).length
  const experimentCount = useCmsItems('experiment', Object.values(EXPERIMENTS)).length

  useSEO({
    title: 'The Lab',
    description: 'Softcurse Lab — applications, developer tools, utilities, and experimental systems.',
    url: '/lab',
  })
  usePageTitle('The Lab')

  return (
    <div>
      <header className="page-header grid-bg">
        <div className="scanline" />
        <div className="page-header__eyebrow">{'// MODULE DIRECTORY'}</div>
        <h1 className="page-header__title">THE LAB</h1>
        <p className="page-header__desc">
          Software systems built for real work. Choose a division to explore finished tools,
          active development, or unstable ideas still being tested.
        </p>
      </header>

      <section className={`container section ${styles.grid}`} aria-label="Lab sections">
        <Link to="/lab/apps" className={styles.card}>
          <span className={styles.index}>01</span>
          <span className={styles.eyebrow}>PRIMARY CATALOG</span>
          <h2>APPS &amp; TOOLS</h2>
          <p>Windows applications, mobile companions, AI tools, utilities, and developer systems.</p>
          <span className={styles.meta}>{appCount} PROJECTS <b>EXPLORE →</b></span>
        </Link>

        <Link to="/experiments" className={styles.card}>
          <span className={styles.index}>02</span>
          <span className={styles.eyebrow}>SANDBOX</span>
          <h2>EXPERIMENTS</h2>
          <p>Proofs of concept, prototypes, and systems that are useful enough to keep exploring.</p>
          <span className={styles.meta}>{experimentCount} PROJECT{experimentCount === 1 ? '' : 'S'} <b>ENTER →</b></span>
        </Link>
      </section>
    </div>
  )
}

import { LOCALIZATIONS } from '../../data/localizations'
import { useCmsItems } from '../../content/CmsContent'
import LocalizationCard from '../../components/common/LocalizationCard'
import { useSEO } from '../../hooks/useSEO'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import styles from './Localization.module.css'

export default function Localization() {
  useSEO({
    title: 'Localization',
    description: 'Softcurse localization and translation-mod projects, built to bring games and software to Georgian audiences.',
    url: '/localization',
  })
  usePageTitle('Localization')
  const [gridRef, gridVisible] = useScrollReveal(0.05)
  const projects = useCmsItems('localization', Object.values(LOCALIZATIONS))

  return (
    <div>
      <header className={`page-header grid-bg ${styles.header}`}>
        <div className="scanline" />
        <div className="page-header__eyebrow">{'// LANGUAGE SYSTEMS'}</div>
        <h1 className="page-header__title">LOCALIZATION</h1>
        <p className="page-header__desc">
          Translation work, custom type systems, and careful runtime adaptation—built to make
          digital worlds feel native in Georgian without claiming the worlds themselves.
        </p>
      </header>

      <section className="container section">
        <div className={styles.sectionHead}>
          <span className={styles.marker} aria-hidden="true" />
          <div>
            <div className={styles.label}>ACTIVE LOCALIZATION WORK</div>
            <p className={styles.note}>Unofficial fan projects are clearly identified on every project page.</p>
          </div>
        </div>
        <div ref={gridRef} className={`${styles.grid} reveal ${gridVisible ? 'visible' : ''}`}>
          {projects.map(project => <LocalizationCard key={project.id} project={project} />)}
        </div>
      </section>
    </div>
  )
}

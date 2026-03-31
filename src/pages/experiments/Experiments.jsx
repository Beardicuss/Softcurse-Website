import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { getExperiments } from '../../data/experiments'
import ExperimentCard from '../../components/common/ExperimentCard'
import styles from './Experiments.module.css'

export default function Experiments() {
  usePageTitle('Experiments')
  useSEO({
    title: 'Experiments',
    description: 'Softcurse Experiments — a sandbox for prototypes, research, and ideas that don\'t fit neatly anywhere else.',
    url: '/experiments',
  })

  const [headerRef, headerVis] = useScrollReveal(0.05)
  const [gridRef,   gridVis]   = useScrollReveal()

  const experiments = getExperiments()

  return (
    <div className={styles.page}>

      <div className={`page-header ${styles.header}`} ref={headerRef}>
        <div className={`${styles.headerInner} reveal ${headerVis ? 'visible' : ''}`}>
          <div className="sec-header__label">// SOFTCURSE LAB — EXPERIMENTS</div>
          <h1 className={styles.title}>
            SOFTCURSE <span className={styles.accent}>EXPERIMENTS</span>
          </h1>
          <p className={styles.desc}>
            Not every idea deserves a product page. Some things are just running in the dark
            to see what happens. Prototypes, research spikes, and tools that might become
            something — or might not. No promises. No roadmap. Just code.
          </p>
        </div>
      </div>

      <section className={`container ${styles.gridSection}`}>
        <div
          ref={gridRef}
          className={`card-grid reveal-group ${gridVis ? 'visible' : ''}`}
        >
          {experiments.map(e => <ExperimentCard key={e.id} experiment={e} />)}
        </div>
      </section>

    </div>
  )
}

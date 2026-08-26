import { Navigate, useParams } from 'react-router-dom'
import { LOCALIZATIONS } from '../../data/localizations'
import { useCmsItems } from '../../content/CmsContent'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import styles from '../lab/AppDetail.module.css'
import localStyles from './LocalizationDetail.module.css'

export default function LocalizationDetail() {
  const { id } = useParams()
  const projects = useCmsItems('localization', Object.values(LOCALIZATIONS))
  const project = projects.find(item => item.id === id)

  usePageTitle(project ? project.name : '')
  useSEO(project ? {
    title: project.name,
    description: project.shortDesc,
    url: `/localization/${project.id}`,
    image: project.image,
  } : {})

  const [heroRef, heroVisible] = useScrollReveal(0.05)
  const [featuresRef, featuresVisible] = useScrollReveal()
  const [stackRef, stackVisible] = useScrollReveal()

  if (!project) return <Navigate to="/localization" replace />

  return (
    <div className={styles.page}>
      <div className={`${styles.hero} ${localStyles.hero}`} ref={heroRef}>
        <img src={project.heroImage || project.image} alt="" className={`${styles.heroImg} ${localStyles.heroImg}`} loading="eager" fetchPriority="high" decoding="async" />
        <div className={styles.heroOverlay} />
        <div className={`${styles.heroContent} ${heroVisible ? styles.heroVisible : ''}`}>
          <div className={styles.heroBadges}>
            <Badge status={project.status} />
            <span className={styles.heroTag}>{project.tag}</span>
            {project.version && <span className={styles.heroVersion}>v{project.version}</span>}
          </div>
          <h1 className={styles.heroTitle}>{project.name}</h1>
          <p className={styles.heroDesc}>{project.shortDesc}</p>
          <div className={styles.heroActions}>
            {project.playUrl ? <Button variant="cyan" external={project.playUrl}>↗ {project.launchLabel || 'OPEN PROJECT'}</Button> : project.downloadReleases?.length === 0 && <Button variant="outline" disabled>IN DEVELOPMENT</Button>}
            {project.downloadReleases?.map(release => <Button key={release.id} variant="cyan" external={release.url}>↓ {release.label}</Button>)}
            <Button variant="ghost" href="/localization">← BACK TO LOCALIZATION</Button>
          </div>
        </div>
      </div>

      <div className="container--narrow">
        <aside className={localStyles.disclaimer} aria-label="Project attribution">
          <span className={localStyles.disclaimerLabel}>UNOFFICIAL FAN PROJECT</span>
          <p>{project.disclaimer}</p>
        </aside>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>{'// OVERVIEW'}</div>
          <p className={styles.desc}>{project.desc}</p>
        </section>

        <section className={styles.section} ref={featuresRef}>
          <div className={styles.sectionLabel}>{'// PROJECT SCOPE'}</div>
          <h2 className={styles.sectionTitle}>What has been built</h2>
          <ul className={`${styles.featGrid} reveal-group ${featuresVisible ? 'visible' : ''}`}>
            {project.features.map(feature => (
              <li key={feature} className={styles.featItem}>
                <span className={styles.featCheck}>▸</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.section} reveal ${stackVisible ? 'visible' : ''}`} ref={stackRef}>
          <div className={styles.sectionLabel}>{'// TOOLCHAIN'}</div>
          <h2 className={styles.sectionTitle}>Built with</h2>
          <div className={styles.stackGrid}>
            {project.techStack.map(tool => (
              <div key={tool} className={styles.stackItem}><span className={styles.stackDot} />{tool}</div>
            ))}
          </div>
        </section>

        <section className={styles.metaSection}>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>STATUS</span>
            <span className={`${styles.metaVal} ${styles.dev}`}>◎ IN DEVELOPMENT</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>TEXT CORPUS</span>
            <span className={styles.metaVal}>1,879 / 1,879</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>REMAINING GATE</span>
            <span className={styles.metaVal}>VISUAL QA + PACKAGING</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>CATEGORY</span>
            <span className={styles.metaVal}>{project.tag}</span>
          </div>
        </section>
      </div>
    </div>
  )
}

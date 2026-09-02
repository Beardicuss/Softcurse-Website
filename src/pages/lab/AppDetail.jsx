import { useParams, Navigate } from 'react-router-dom'
import { APPS } from '../../data/apps'
import { useCmsItems, useCmsReady, useCmsRecord } from '../../content/CmsContent'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import AppCard from '../../components/common/AppCard'
import { ProductPrimaryActions, ProductReleasePanel } from '../../components/common/ProductAccess'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useSEO } from '../../hooks/useSEO'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import styles from './AppDetail.module.css'

function formatReleaseDate(value) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replaceAll('/', '.')
}

export default function AppDetail() {
  const { id } = useParams()
  const apps = useCmsItems('app', Object.values(APPS))
  const cmsReady = useCmsReady()
  const app = useCmsRecord('app', id, APPS[id])

  usePageTitle(app ? app.name : '')
  useSEO(app ? {
    title: app.name,
    description: app.shortDesc + ' — ' + (app.techStack || []).join(', ') + '. Part of the Softcurse Lab.',
    url: `/lab/${app.id}`,
    image: app.image || undefined,
  } : {})

  const [heroRef, heroVis] = useScrollReveal(0.05)
  const [featRef, featVis] = useScrollReveal()
  const [stackRef, stackVis] = useScrollReveal()
  const [relatedRef, relatedVis] = useScrollReveal()

  if (!app && !cmsReady) return null
  if (!app) return <Navigate to="/lab" replace />
  if (app.id !== id) return <Navigate to={`/lab/${app.id}`} replace />

  const statusLabel = { active: '● LIVE', beta: '⬡ BETA', alpha: '△ EARLY ALPHA', dev: '◎ IN DEV', planned: '○ PLANNED' }
  const relatedTools = apps
    .filter(a => a.id !== app.id && (a.tag === app.tag || a.status === app.status))
    .slice(0, 3)

  return (
    <div className={styles.page}>

      {/* ── HERO BANNER ── */}
      <div className={styles.hero} ref={heroRef}>
        {(app.heroImage || app.image)
          ? <img src={app.heroImage || app.image} alt={app.name} className={styles.heroImg} loading="eager" fetchPriority="high" decoding="async" />
          : <div className={styles.heroPlaceholder}><span className={styles.heroIcon}>{app.icon}</span></div>
        }
        <div className={styles.heroOverlay} />
        <div className={`${styles.heroContent} ${heroVis ? styles.heroVisible : ''}`}>
          <div className={styles.heroBadges}>
            <Badge status={app.status} />
            <span className={styles.heroTag}>{app.tag}</span>
            {app.version && <span className={styles.heroVersion}>v{app.version}</span>}
          </div>
          <h1 className={styles.heroTitle}>{app.name}</h1>
          <p className={styles.heroDesc}>{app.shortDesc}</p>
          <div className={styles.heroActions}>
            <ProductPrimaryActions product={app} emptyLabel={app.status === 'active' ? 'RELEASE PENDING' : 'IN DEVELOPMENT'} />
            <Button variant="ghost" href="/lab/apps">← BACK TO APPS</Button>
          </div>
        </div>
      </div>

      <div className="container--narrow">

        {/* ── DESCRIPTION ── */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>{"// OVERVIEW"}</div>
          <p className={styles.desc}>{app.desc}</p>
        </section>
        <ProductReleasePanel product={app} />

        {/* ── FEATURES GRID ── */}
        <section className={styles.section} ref={featRef}>
          <div className={styles.sectionLabel}>{"// CORE FEATURES"}</div>
          <h2 className={styles.sectionTitle}>What it does</h2>
          <ul className={`${styles.featGrid} reveal-group ${featVis ? 'visible' : ''}`}>
            {app.features.map((f, i) => (
              <li key={i} className={styles.featItem}>
                <span className={styles.featCheck}>▸</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── TECH STACK ── */}
        {app.techStack && (
          <section className={`${styles.section} reveal ${stackVis ? 'visible' : ''}`} ref={stackRef}>
            <div className={styles.sectionLabel}>{"// TECH STACK"}</div>
            <h2 className={styles.sectionTitle}>Built with</h2>
            <div className={styles.stackGrid}>
              {app.techStack.map(t => (
                <div key={t} className={styles.stackItem}>
                  <span className={styles.stackDot} />
                  {t}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── META INFO ROW ── */}
        <section className={styles.metaSection}>
          {app.releaseDate && (
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>FIRST RELEASE</span>
              <span className={styles.metaVal}>{formatReleaseDate(app.releaseDate)}</span>
            </div>
          )}
          {app.version && (
            <div className={styles.metaItem}>
              <span className={styles.metaKey}>CURRENT VERSION</span>
              <span className={styles.metaVal}>v{app.version}</span>
            </div>
          )}
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>STATUS</span>
            <span className={`${styles.metaVal} ${styles[app.status]}`}>{statusLabel[app.status]}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaKey}>CATEGORY</span>
            <span className={styles.metaVal}>{app.tag}</span>
          </div>
        </section>

        {/* ── RELATED ── */}
        {relatedTools.length > 0 && (
          <section className={`${styles.section} reveal ${relatedVis ? 'visible' : ''}`} ref={relatedRef}>
            <div className={styles.sectionLabel}>{"// MORE FROM THE LAB"}</div>
            <h2 className={styles.sectionTitle}>Related tools</h2>
            <div className={styles.relatedGrid}>
              {relatedTools.map(a => <AppCard key={a.id} app={a} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

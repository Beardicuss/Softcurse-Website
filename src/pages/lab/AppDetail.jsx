import { useParams, Link, Navigate } from 'react-router-dom'
import { APPS, getApps } from '../../data/apps'
import Button from '../../components/common/Button'
import AppCard from '../../components/common/AppCard'
import styles from './AppDetail.module.css'
import { usePageTitle } from '../../hooks/usePageTitle'

export default function AppDetail() {
  const { id } = useParams()
  const app = APPS[id]
  if (!app) return <Navigate to="/lab" replace />
  usePageTitle(app.name)

  const statusLabel = { active: '● LIVE', dev: '◎ IN DEV', planned: '○ PLANNED' }

  // Compute related tools outside JSX — same tag or same status, exclude self
  const relatedTools = getApps()
    .filter(a => a.id !== app.id && (a.tag === app.tag || a.status === app.status))
    .slice(0, 3)

  return (
    <div className={styles.page}>
      <div className="container--narrow">

        {/* Back */}
        <Link to="/lab" className={styles.back}>← BACK TO LAB</Link>

        {/* Meta row */}
        <div className={styles.metaRow}>
          <span className={`${styles.statusBadge} ${styles[app.status]}`}>
            {statusLabel[app.status]}
          </span>
          <span className={styles.tag}>{app.tag}</span>
          {app.version && (
            <span className={styles.version}>v{app.version}</span>
          )}
        </div>

        {/* Title */}
        <div className={styles.icon}>{app.icon}</div>
        <h1 className={styles.title}>{app.name}</h1>
        <div className={styles.meta}>SOFTCURSE LAB // {app.tag}</div>

        {/* Description */}
        <p className={styles.desc}>{app.desc}</p>

        {/* Features */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Core Features</h2>
          <ul className={styles.featGrid}>
            {app.features.map(f => <li key={f}>{f}</li>)}
          </ul>
        </section>

        {/* Tech stack */}
        {app.techStack && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Tech Stack</h2>
            <div className={styles.techStack}>
              {app.techStack.map(t => (
                <span key={t} className={styles.tech}>{t}</span>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About This Tool</h2>
          <p className={styles.bodyText}>
            {app.name} is part of the Softcurse Lab ecosystem — a suite of tools
            designed to solve specific problems without compromise. No feature bloat.
            No unnecessary UI polish over substance. This tool was built because
            nothing else did exactly what it needed to do.
          </p>
          {app.releaseDate && (
            <p className={`${styles.bodyText} ${styles.bodyTextSpaced}`}>
              <span className={styles.infoLabel}>First released:</span>{' '}
              {new Date(app.releaseDate).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          )}
        </section>

        {/* Related tools */}
        {relatedTools.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Related Tools</h2>
            <div className={styles.relatedGrid}>
              {relatedTools.map(a => <AppCard key={a.id} app={a} />)}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {app.status === 'active' && (
            <Button variant="cyan">LAUNCH APP</Button>
          )}
          <Button variant="outline">DOCUMENTATION</Button>
          <Button variant="ghost" href="/lab">← BACK TO LAB</Button>
        </div>

      </div>
    </div>
  )
}

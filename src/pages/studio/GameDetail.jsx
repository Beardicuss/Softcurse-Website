import { useParams, Link, Navigate } from 'react-router-dom'
import { GAMES } from '../../data/games'
import Button from '../../components/common/Button'
import { usePageTitle } from '../../hooks/usePageTitle'
import styles from './GameDetail.module.css'

export default function GameDetail() {
  const { id } = useParams()
  const game = GAMES[id]
  if (!game) return <Navigate to="/studio" replace />
  usePageTitle(game.name)

  const statusLabel = { active: '● LIVE', dev: '◎ IN DEV', planned: '○ PLANNED' }

  return (
    <div className={styles.page}>
      <div className="container--narrow">

        <Link to="/studio" className={styles.back}>← BACK TO STUDIO</Link>

        <div className={styles.metaRow}>
          <span className={`${styles.statusBadge} ${styles[game.status]}`}>
            {statusLabel[game.status]}
          </span>
          <span className={styles.tag}>{game.tag}</span>
          <span className={styles.engine}>{game.engine}</span>
        </div>

        <div className={styles.icon}>{game.icon}</div>
        <h1 className={styles.title}>{game.name}</h1>
        <div className={styles.meta}>
          SOFTCURSE STUDIO // {game.genre.toUpperCase()} // {game.platforms.join(' · ')}
        </div>

        <p className={styles.desc}>{game.desc}</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Game Features</h2>
          <ul className={styles.featGrid}>
            {game.features.map(f => <li key={f}>{f}</li>)}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Development Status</h2>
          <p className={styles.bodyText}>
            {game.name} is currently{' '}
            {game.status === 'planned' ? 'in planning stages at' : 'in active development at'}{' '}
            Softcurse Studio. Updates, dev blogs, trailers, and media drops will appear here
            as the project evolves. Dark things are coming.
          </p>
          {game.version && (
            <p className={`${styles.bodyText} ${styles.bodyTextSpaced}`}>
              <span className={styles.infoLabel}>Current build:</span> {game.version}
            </p>
          )}
        </section>

        {game.devBlog.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Dev Blog</h2>
            <div className={styles.devBlog}>
              {game.devBlog.map(post => (
                <Link to="/blog" key={post.date} className={styles.devPost}>
                  <span className={styles.devDate}>{post.date}</span>
                  <span className={styles.devTitle}>{post.title}</span>
                  <span className={styles.devExc}>{post.excerpt}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className={styles.actions}>
          <Button variant="magenta">WISHLIST</Button>
          <Button variant="outlineMagenta" href="/blog">DEV BLOG</Button>
          <Button variant="ghost" href="/studio">← BACK TO STUDIO</Button>
        </div>

      </div>
    </div>
  )
}

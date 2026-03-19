import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { POSTS } from '../data/blog'
import { usePageTitle } from '../hooks/usePageTitle'
import { useScrollReveal } from '../hooks/useScrollReveal'
import styles from './Blog.module.css'

const CATEGORIES = ['ALL', ...new Set(POSTS.map(p => p.category))]

export default function Blog() {
  useSEO({ title: 'Blog', description: 'Development dispatches, design decisions, and engineering insights from the Softcurse universe.', url: '/blog' })
  usePageTitle('Blog')
  const [active, setActive] = useState('ALL')
  const [gridRef, gridVis] = useScrollReveal()

  const filtered = active === 'ALL'
    ? POSTS
    : POSTS.filter(p => p.category === active)

  return (
    <div>
      <div className="page-header grid-bg">
        <div className="scanline" />
        <div className="page-header__eyebrow">// TRANSMISSIONS</div>
        <h1 className="page-header__title">BLOG</h1>
        <p className="page-header__desc">
          Development dispatches, design decisions, and occasional manifestos
          from the Lab and Studio.
        </p>
      </div>

      <div className="container section">

        {/* Category filter */}
        <div className={styles.filters}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.filter} ${active === cat ? styles.filterActive : ''}`}
              onClick={() => setActive(cat)}
              aria-pressed={active === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        <div ref={gridRef} className={`${styles.grid} reveal-group ${gridVis ? 'visible' : ''}`}>
          {filtered.map(post => (
            <Link key={post.id} to={`/blog/${post.id}`} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.cat}>{post.category}</span>
                <span className={styles.read}>{post.readTime} read</span>
              </div>
              <div className={styles.date}>{post.date}</div>
              <h2 className={styles.title}>{post.title}</h2>
              <p className={styles.excerpt}>{post.excerpt}</p>
              <span className={styles.cta}>READ MORE →</span>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>◌</span>
            <p>No posts in this category yet.</p>
          </div>
        )}

      </div>
    </div>
  )
}

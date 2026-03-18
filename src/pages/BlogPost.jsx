import { useParams, Link, Navigate } from 'react-router-dom'
import { getPost, POSTS } from '../data/blog'
import Button from '../components/common/Button'
import ShareButtons from '../components/common/ShareButtons'
import Newsletter from '../components/common/Newsletter'
import { usePageTitle } from '../hooks/usePageTitle'
import styles from './BlogPost.module.css'

export default function BlogPost() {
  const { id } = useParams()
  const post = getPost(id)
  if (!post) return <Navigate to="/blog" replace />
  usePageTitle(post.title)

  // Render minimal markdown: ## headings and paragraphs
  const renderContent = (raw) => {
    return raw.trim().split('\n\n').map((block, i) => {
      const trimmed = block.trim()
      if (!trimmed) return null
      if (trimmed.startsWith('## ')) {
        return <h2 key={`h-${i}`} className={styles.h2}>{trimmed.replace('## ', '')}</h2>
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={`b-${i}`} className={styles.bold}>{trimmed.replace(/\*\*/g, '')}</p>
      }
      return <p key={`p-${i}`} className={styles.p}>{trimmed}</p>
    }).filter(Boolean)
  }

  // Related posts (same category, exclude current)
  const related = POSTS.filter(p => p.category === post.category && p.id !== post.id).slice(0, 2)

  return (
    <div className={styles.page}>
      <div className="container--narrow">

        <Link to="/blog" className={styles.back}>← BACK TO BLOG</Link>

        {/* Header */}
        <div className={styles.meta}>
          <span className={styles.cat}>{post.category}</span>
          <span className={styles.sep}>//</span>
          <span className={styles.date}>{post.date}</span>
          <span className={styles.sep}>//</span>
          <span className={styles.readTime}>{post.readTime} read</span>
        </div>

        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.excerpt}>{post.excerpt}</p>

        <div className={styles.divider} />

        {/* Content */}
        <article className={styles.article} aria-label="Post content">
          {renderContent(post.content)}
        </article>

        <div className={styles.divider} />

        {/* Footer actions */}
        <div className={styles.postFooter}>
          <div className={styles.actions}>
            <Button variant="outline" href="/blog">← ALL POSTS</Button>
            <Button variant="outlineMagenta" href="/contact">DISCUSS THIS</Button>
          </div>
          <ShareButtons title={post.title} />
        </div>

        {/* Newsletter signup */}
        <div className={styles.newsletterWrap}>
          <Newsletter />
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className={styles.related}>
            <div className={styles.relatedLabel}>// RELATED</div>
            <div className={styles.relatedGrid}>
              {related.map(p => (
                <Link key={p.id} to={`/blog/${p.id}`} className={styles.relatedCard}>
                  <div className={styles.relatedDate}>{p.date}</div>
                  <div className={styles.relatedTitle}>{p.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../../hooks/useSearch'
import EyeIcon from './EyeIcon'
import styles from './SearchBar.module.css'

export default function SearchBar({ onClose }) {
  const [query, setQuery] = useState('')
  const { apps, games, localizations, posts, total } = useSearch(query)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  // Close on Escape
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable.at(-1)
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const go = (path) => { navigate(path); onClose?.() }

  const hasResults = total > 0
  const showEmpty  = query.trim().length >= 2 && !hasResults

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={panelRef} className={styles.panel} role="dialog" aria-modal="true" aria-label="Search Softcurse content">
        <div className={styles.inputRow}>
          <EyeIcon size={22} className={styles.eyeIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search tools, games, localization, posts..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search"
            autoComplete="off"
          />
          {query && (
            <button className={styles.clear} onClick={() => setQuery('')} aria-label="Clear">✕</button>
          )}
          <button className={styles.close} onClick={onClose} aria-label="Close search">ESC</button>
        </div>

        {(hasResults || showEmpty) && (
          <div className={styles.results}>
            {showEmpty && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>◌</span>
                No results for <strong>&ldquo;{query}&rdquo;</strong>
              </div>
            )}

            {apps.length > 0 && (
              <div className={styles.group}>
                <div className={styles.groupLabel}>LAB TOOLS</div>
                {apps.map(a => (
                  <button key={a.id} className={styles.item} onClick={() => go(`/lab/${a.id}`)}>
                    <span className={styles.itemIcon}>{a.icon}</span>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{a.name}</div>
                      <div className={styles.itemSub}>{a.shortDesc}</div>
                    </div>
                    <span className={styles.itemTag}>{a.tag}</span>
                  </button>
                ))}
              </div>
            )}

            {games.length > 0 && (
              <div className={styles.group}>
                <div className={styles.groupLabel}>STUDIO GAMES</div>
                {games.map(g => (
                  <button key={g.id} className={styles.item} onClick={() => go(`/studio/${g.id}`)}>
                    <span className={styles.itemIcon}>{g.icon}</span>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{g.name}</div>
                      <div className={styles.itemSub}>{g.shortDesc}</div>
                    </div>
                    <span className={styles.itemTag} style={{ color: 'var(--magenta)', borderColor: 'rgba(255,0,255,0.25)' }}>{g.genre}</span>
                  </button>
                ))}
              </div>
            )}

            {localizations.length > 0 && (
              <div className={styles.group}>
                <div className={styles.groupLabel}>LOCALIZATION</div>
                {localizations.map(item => (
                  <button key={item.id} className={styles.item} onClick={() => go(`/localization/${item.id}`)}>
                    <span className={styles.itemIcon}>{item.icon}</span>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{item.name}</div>
                      <div className={styles.itemSub}>{item.shortDesc}</div>
                    </div>
                    <span className={styles.itemTag}>{item.tag}</span>
                  </button>
                ))}
              </div>
            )}

            {posts.length > 0 && (
              <div className={styles.group}>
                <div className={styles.groupLabel}>BLOG POSTS</div>
                {posts.map(p => (
                  <button key={p.id} className={styles.item} onClick={() => go(`/blog/${p.id}`)}>
                    <span className={styles.itemIcon} style={{ fontSize: '1rem' }}>▦</span>
                    <div className={styles.itemContent}>
                      <div className={styles.itemTitle}>{p.title}</div>
                      <div className={styles.itemSub}>{p.date} · {p.readTime} read</div>
                    </div>
                    <span className={styles.itemTag} style={{ color: 'var(--green)', borderColor: 'rgba(57,255,20,0.25)' }}>{p.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className={styles.hint}>
            <span>Try: <em>GELA</em>, <em>Blasphemous</em>, <em>FakeChecker</em></span>
          </div>
        )}
      </div>
    </div>
  )
}

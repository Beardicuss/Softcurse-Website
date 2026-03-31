import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { getApps } from '../../data/apps'
import { getGames } from '../../data/games'
import SearchButton from './SearchButton'
import SearchBar from './SearchBar'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen]     = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const location = useLocation()
  const navRef   = useRef(null)

  useEffect(() => { setMenuOpen(false); setOpenDropdown(null) }, [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setMenuOpen(false); setOpenDropdown(null); setSearchOpen(false) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    const onClickOut = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOut)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOut)
    }
  }, [])

  const toggleDropdown = (name) => setOpenDropdown(prev => prev === name ? null : name)
  const apps  = getApps()
  const games = getGames()
  const linkCls = ({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link

  return (
    <>
    <nav
      className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}
      ref={navRef}
      aria-label="Main navigation"
    >
      <div className={styles.inner}>

        {/* ── MOBILE: hamburger LEFT ── */}
        <button
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
        </button>

        {/* ── Logo — center on mobile, left on desktop ── */}
        <Link to="/" className={styles.logo} aria-label="Softcurse home">
          <img src="/logo.png" alt="" className={styles.logoImg} aria-hidden="true" />
          SOFTCURSE
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`} role="list">
          <li><NavLink to="/" className={linkCls} end>HOME</NavLink></li>

          <li className={styles.dropdown}>
            <button
              className={`${styles.link} ${location.pathname.startsWith('/lab') ? styles.active : ''}`}
              onClick={() => toggleDropdown('lab')}
              aria-expanded={openDropdown === 'lab'}
              aria-haspopup="true"
            >
              LAB <span className={styles.arrow} aria-hidden="true">▾</span>
            </button>
            <div className={`${styles.menu} ${openDropdown === 'lab' ? styles.menuOpen : ''}`} role="menu">
              <div className={styles.menuHead}>Tools &amp; Apps</div>
              <Link to="/lab" className={styles.menuItem} role="menuitem">Lab Home</Link>
              <Link to="/experiments" className={styles.menuItem} role="menuitem">Experiments</Link>
              {apps.map(a => (
                <Link key={a.id} to={`/lab/${a.id}`} className={styles.menuItem} role="menuitem">{a.name}</Link>
              ))}
            </div>
          </li>

          <li className={styles.dropdown}>
            <button
              className={`${styles.link} ${location.pathname.startsWith('/studio') ? styles.active : ''}`}
              onClick={() => toggleDropdown('studio')}
              aria-expanded={openDropdown === 'studio'}
              aria-haspopup="true"
            >
              STUDIO <span className={styles.arrow} aria-hidden="true">▾</span>
            </button>
            <div className={`${styles.menu} ${openDropdown === 'studio' ? styles.menuOpen : ''}`} role="menu">
              <div className={styles.menuHead}>Games</div>
              <Link to="/studio" className={styles.menuItem} role="menuitem">Studio Home</Link>
              <Link to="/chronicles" className={styles.menuItem} role="menuitem">Chronicles</Link>
              {games.map(g => (
                <Link key={g.id} to={`/studio/${g.id}`} className={styles.menuItem} role="menuitem">{g.name}</Link>
              ))}
            </div>
          </li>

          <li><NavLink to="/about"   className={linkCls}>ABOUT</NavLink></li>
          <li><NavLink to="/contact" className={linkCls}>CONTACT</NavLink></li>
          <li><NavLink to="/blog"    className={linkCls}>BLOG</NavLink></li>
          <li><NavLink to="/roadmap" className={linkCls}>ROADMAP</NavLink></li>
          <li><NavLink to="/press"   className={linkCls}>PRESS</NavLink></li>

          {/* Search inside mobile menu */}
          <li className={styles.mobileSearchItem}>
            <button
              className={styles.mobileSearchBtn}
              onClick={() => { setMenuOpen(false); setSearchOpen(true) }}
            >
              <span>⌕</span> SEARCH
            </button>
          </li>
        </ul>

        {/* ── Right: Search (desktop only) + Theme toggle ── */}
        <div className={styles.iconGroup}>
          <span className={styles.desktopOnly}>
            <SearchButton onClick={() => setSearchOpen(true)} />
          </span>
        </div>

      </div>
    </nav>
    {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
    </>
  )
}

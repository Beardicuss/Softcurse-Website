import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import SearchButton from './SearchButton'
import styles from './Navbar.module.css'

const SearchBar = lazy(() => import('./SearchBar'))

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const [menuOpenAt, setMenuOpenAt] = useState(null)
  const [dropdownState, setDropdownState] = useState({ name: null, locationKey: null })
  const navRef = useRef(null)
  const menuOpen = menuOpenAt === location.key
  const openDropdown = dropdownState.locationKey === location.key ? dropdownState.name : null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setMenuOpenAt(null); setDropdownState({ name: null, locationKey: null }); setSearchOpen(false) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    const onClickOut = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setDropdownState({ name: null, locationKey: null })
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOut)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOut)
    }
  }, [])

  const toggleDropdown = (name) => setDropdownState(previous => ({
    name: previous.locationKey === location.key && previous.name === name ? null : name,
    locationKey: location.key,
  }))
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
            onClick={() => setMenuOpenAt(previous => previous === location.key ? null : location.key)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>

          {/* ── Logo — center on mobile, left on desktop ── */}
          <Link to="/" className={styles.logo} aria-label="Softcurse home">
            <img src="/logo.webp" alt="" className={styles.logoImg} aria-hidden="true" fetchPriority="high" />
            SOFTCURSE
          </Link>

          {/* ── Desktop nav links ── */}
          <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`} role="list">
            <li><NavLink to="/" className={linkCls} end>HOME</NavLink></li>

            <li className={styles.dropdown}>
              <button
                className={`${styles.link} ${(location.pathname.startsWith('/lab') || location.pathname.startsWith('/experiments') || location.pathname.startsWith('/localization')) ? styles.active : ''}`}
                onClick={() => toggleDropdown('lab')}
                aria-expanded={openDropdown === 'lab'}
                aria-controls="lab-nav-menu"
              >
                LAB <span className={styles.arrow} aria-hidden="true">▾</span>
              </button>
              <div id="lab-nav-menu" className={`${styles.menu} ${openDropdown === 'lab' ? styles.menuOpen : ''}`}>
                <div className={styles.menuHead}>Lab Directory</div>
                <Link to="/lab" className={styles.menuItem}>Overview</Link>
                <Link to="/lab/apps" className={styles.menuItem}>Apps &amp; Tools</Link>
                <Link to="/experiments" className={styles.menuItem}>Experiments</Link>
                <Link to="/localization" className={styles.menuItem}>Localization</Link>
              </div>
            </li>

            <li className={styles.dropdown}>
              <button
                className={`${styles.link} ${location.pathname.startsWith('/studio') ? styles.active : ''}`}
                onClick={() => toggleDropdown('studio')}
                aria-expanded={openDropdown === 'studio'}
                aria-controls="studio-nav-menu"
              >
                STUDIO <span className={styles.arrow} aria-hidden="true">▾</span>
              </button>
              <div id="studio-nav-menu" className={`${styles.menu} ${openDropdown === 'studio' ? styles.menuOpen : ''}`}>
                <div className={styles.menuHead}>Studio Directory</div>
                <Link to="/studio" className={styles.menuItem}>Overview</Link>
                <Link to="/studio/games" className={styles.menuItem}>Games</Link>
              </div>
            </li>

            <li><NavLink to="/chronicles" className={linkCls}>CHRONICLES</NavLink></li>
            <li><NavLink to="/blog" className={linkCls}>BLOG</NavLink></li>
            <li><NavLink to="/about" className={linkCls}>ABOUT</NavLink></li>

            <li className={styles.dropdown}>
              <button
                className={`${styles.link} ${(['/contact', '/roadmap', '/press'].some(path => location.pathname.startsWith(path))) ? styles.active : ''}`}
                onClick={() => toggleDropdown('info')}
                aria-expanded={openDropdown === 'info'}
                aria-controls="info-nav-menu"
              >
                INFO <span className={styles.arrow} aria-hidden="true">▾</span>
              </button>
              <div id="info-nav-menu" className={`${styles.menu} ${openDropdown === 'info' ? styles.menuOpen : ''}`}>
                <div className={styles.menuHead}>Information</div>
                <Link to="/contact" className={styles.menuItem}>Contact</Link>
                <Link to="/roadmap" className={styles.menuItem}>Roadmap</Link>
                <Link to="/press" className={styles.menuItem}>Press Kit</Link>
              </div>
            </li>

            {/* Search inside mobile menu */}
            <li className={styles.mobileSearchItem}>
              <button
                className={styles.mobileSearchBtn}
                onClick={() => { setMenuOpenAt(null); setSearchOpen(true) }}
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
      {searchOpen && <Suspense fallback={null}><SearchBar onClose={() => setSearchOpen(false)} /></Suspense>}
    </>
  )
}

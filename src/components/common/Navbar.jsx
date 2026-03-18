import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { getApps } from '../../data/apps'
import { getGames } from '../../data/games'
import ThemeToggle from './ThemeToggle'
import SearchButton from './SearchButton'
import SearchBar from './SearchBar'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled]   = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null) // 'lab' | 'studio' | null
  const location = useLocation()
  const navRef   = useRef(null)

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false)
    setOpenDropdown(null)
  }, [location])

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keyboard: Escape closes menus; click outside closes
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setMenuOpen(false); setOpenDropdown(null); setSearchOpen(false) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    const onClickOut = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOut)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOut)
    }
  }, [])

  const toggleDropdown = (name) =>
    setOpenDropdown(prev => (prev === name ? null : name))

  const apps  = getApps()
  const games = getGames()

  const linkCls = ({ isActive }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link

  return (
    <>
    <nav
      className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}
      ref={navRef}
      aria-label="Main navigation"
    >
      <div className={styles.inner}>

        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="Softcurse home">
          <img src="/logo.png" alt="" className={styles.logoImg} aria-hidden="true" />
          SOFTCURSE
        </Link>

        {/* Desktop links */}
        <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`} role="list">
          <li>
            <NavLink to="/" className={linkCls} end>HOME</NavLink>
          </li>

          {/* Lab dropdown */}
          <li className={styles.dropdown}>
            <button
              className={`${styles.link} ${location.pathname.startsWith('/lab') ? styles.active : ''}`}
              onClick={() => toggleDropdown('lab')}
              aria-expanded={openDropdown === 'lab'}
              aria-haspopup="true"
            >
              LAB <span className={styles.arrow} aria-hidden="true">▾</span>
            </button>
            <div
              className={`${styles.menu} ${openDropdown === 'lab' ? styles.menuOpen : ''}`}
              role="menu"
            >
              <div className={styles.menuHead}>Tools &amp; Apps</div>
              <Link to="/lab" className={styles.menuItem} role="menuitem">Lab Home</Link>
              {apps.map(a => (
                <Link key={a.id} to={`/lab/${a.id}`} className={styles.menuItem} role="menuitem">
                  {a.name}
                </Link>
              ))}
            </div>
          </li>

          {/* Studio dropdown */}
          <li className={styles.dropdown}>
            <button
              className={`${styles.link} ${location.pathname.startsWith('/studio') ? styles.active : ''}`}
              onClick={() => toggleDropdown('studio')}
              aria-expanded={openDropdown === 'studio'}
              aria-haspopup="true"
            >
              STUDIO <span className={styles.arrow} aria-hidden="true">▾</span>
            </button>
            <div
              className={`${styles.menu} ${openDropdown === 'studio' ? styles.menuOpen : ''}`}
              role="menu"
            >
              <div className={styles.menuHead}>Games</div>
              <Link to="/studio" className={styles.menuItem} role="menuitem">Studio Home</Link>
              {games.map(g => (
                <Link key={g.id} to={`/studio/${g.id}`} className={styles.menuItem} role="menuitem">
                  {g.name}
                </Link>
              ))}
            </div>
          </li>

          <li><NavLink to="/about"   className={linkCls}>ABOUT</NavLink></li>
          <li><NavLink to="/contact" className={linkCls}>CONTACT</NavLink></li>
          <li><NavLink to="/blog"    className={linkCls}>BLOG</NavLink></li>
          <li><NavLink to="/roadmap" className={linkCls}>ROADMAP</NavLink></li>
          <li><NavLink to="/press"   className={linkCls}>PRESS</NavLink></li>
        </ul>

        {/* Right icon group — search + theme + hamburger, tightly spaced */}
        <div className={styles.iconGroup}>
          <SearchButton onClick={() => setSearchOpen(true)} />

          <ThemeToggle />

          <button
            className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
    {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
    </>
  )
}

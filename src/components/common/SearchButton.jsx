import styles from './SearchButton.module.css'

export default function SearchButton({ onClick }) {
  return (
    <button
      className={styles.btn}
      onClick={onClick}
      aria-label="Search (Ctrl+K)"
      title="Search (Ctrl+K)"
    >
      <span className={styles.nebula} aria-hidden="true" />
      <span className={styles.starfield} aria-hidden="true" />
      <span className={styles.stardust} aria-hidden="true" />
      <span className={styles.cosmicRing} aria-hidden="true" />
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.searchIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.4 15.4 4.1 4.1" />
        </svg>
      </span>
      <span className={styles.label}>EXPLORE</span>
      <span className={styles.shortcut}>CTRL K</span>
      <span className={styles.portal} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5c2.1 2.4 3.1 5.2 3.1 8.5s-1 6.1-3.1 8.5C9.9 18.1 8.9 15.3 8.9 12S9.9 5.9 12 3.5ZM3.5 12h17" />
        </svg>
      </span>
    </button>
  )
}

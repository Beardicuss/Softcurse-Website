import EyeIcon from './EyeIcon'
import styles from './SearchButton.module.css'

/**
 * Search trigger button — bare glowing eye icon, no box/sphere.
 * Flickers like the uploaded SVG animation.
 */
export default function SearchButton({ onClick }) {
  return (
    <button
      className={styles.btn}
      onClick={onClick}
      aria-label="Search (Ctrl+K)"
      title="Search (Ctrl+K)"
    >
      <EyeIcon size={34} className={styles.icon} />
    </button>
  )
}

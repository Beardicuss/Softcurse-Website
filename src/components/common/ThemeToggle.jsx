import { useTheme } from '../../hooks/useTheme'
import styles from './ThemeToggle.module.css'

/**
 * Holographic toggle switch — dark (cyan) / light (green) themed.
 * Adapted from the holo-toggle design to match Softcurse palette.
 */
export default function ThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <div className={styles.wrap} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <input
        className={styles.input}
        id="sc-theme-toggle"
        type="checkbox"
        checked={!isDark}
        onChange={toggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <label className={styles.track} htmlFor="sc-theme-toggle">

        {/* Track scan line */}
        <div className={styles.trackLines}>
          <div className={styles.trackLine} />
        </div>

        {/* Thumb */}
        <div className={styles.thumb}>
          <div className={styles.thumbCore} />
          <div className={styles.thumbInner} />
          <div className={styles.thumbScan} />
          <div className={styles.thumbParticles}>
            <div className={styles.thumbParticle} />
            <div className={styles.thumbParticle} />
            <div className={styles.thumbParticle} />
            <div className={styles.thumbParticle} />
          </div>
        </div>

        {/* Labels */}
        <div className={styles.data}>
          <span className={`${styles.dataText} ${styles.dataOff}`}>◑</span>
          <span className={`${styles.dataText} ${styles.dataOn}`}>☀</span>
          <span className={`${styles.dot} ${styles.dotOff}`} />
          <span className={`${styles.dot} ${styles.dotOn}`} />
        </div>

        {/* Energy rings around thumb */}
        <div className={styles.rings}>
          <div className={styles.ring} />
          <div className={styles.ring} />
          <div className={styles.ring} />
        </div>

        <div className={styles.reflection} />
        <div className={styles.holoGlow} />
      </label>
    </div>
  )
}

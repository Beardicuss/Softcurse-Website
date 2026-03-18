import styles from './EyeIcon.module.css'

/**
 * Holographic observe / search eye icon.
 * Eye outline + iris rings + rotating arc + pupil + specular.
 * Size controlled via `size` prop (default 18).
 * Color inherits `currentColor` from parent.
 */
export default function EyeIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      aria-hidden="true"
      className={`${styles.icon} ${className}`}
    >
      {/* Outer eye shape */}
      <path
        d="M8 30 C15 18 45 18 52 30 C45 42 15 42 8 30z"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.85"
      />
      {/* Outer iris ring */}
      <circle cx="30" cy="30" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      {/* Inner iris ring */}
      <circle cx="30" cy="30" r="6"  stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      {/* Rotating arc */}
      <g className={styles.spinArc}>
        <path
          d="M30 22 A8 8 0 0 1 38 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      {/* Pupil */}
      <circle cx="30" cy="30" r="3" fill="currentColor" />
      {/* Specular highlight */}
      <circle cx="33" cy="27" r="1.5" fill="white" opacity="0.55" />
    </svg>
  )
}

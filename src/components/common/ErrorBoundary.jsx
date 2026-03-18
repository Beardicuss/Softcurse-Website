import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

/**
 * Catches any render-time crash and shows a styled fallback
 * instead of a blank white page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[Softcurse ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.code}>ERR</div>
          <div className={styles.label}>// SYSTEM FAULT DETECTED</div>
          <h1 className={styles.title}>SOMETHING BROKE</h1>
          <p className={styles.desc}>
            An unexpected error occurred in the Softcurse system.
            The fault has been logged. Try refreshing or returning home.
          </p>
          {this.state.error && (
            <pre className={styles.trace}>
              {this.state.error.message}
            </pre>
          )}
          <div className={styles.actions}>
            <button className={styles.btnCyan} onClick={() => window.location.reload()}>
              RELOAD
            </button>
            <a href="/" className={styles.btnOutline}>← HOME</a>
          </div>
        </div>
      </div>
    )
  }
}

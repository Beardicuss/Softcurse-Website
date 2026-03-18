import { useState } from 'react'
import styles from './Newsletter.module.css'

/**
 * Reusable newsletter signup strip.
 * Drop anywhere: <Newsletter /> 
 * Accepts optional `compact` prop for footer/sidebar use.
 */
export default function Newsletter({ compact = false }) {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [err, setErr]       = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setErr('')
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErr('Enter a valid email address.')
      return
    }
    setStatus('loading')
    // Simulated submit — replace with your API/Mailchimp/Resend endpoint
    setTimeout(() => setStatus('success'), 900)
  }

  if (status === 'success') {
    return (
      <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
        <div className={styles.success}>
          <span className={styles.successIcon}>✓</span>
          <p className={styles.successMsg}>
            <strong>SIGNAL RECEIVED.</strong><br />
            You're on the list. Expect transmissions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <div className={styles.header}>
          <div className={styles.eyebrow}>// STAY IN THE LOOP</div>
          <h2 className={styles.title}>SOFTCURSE TRANSMISSIONS</h2>
          <p className={styles.desc}>
            Dev updates, game launches, new tools, and dispatches from the Lab.
            No spam. No schedule. Just signal when there's something worth saying.
          </p>
        </div>
      )}
      {compact && (
        <div className={styles.compactLabel}>STAY UPDATED</div>
      )}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <input
          type="email"
          className={`${styles.input} ${err ? styles.inputErr : ''}`}
          placeholder="your@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setErr('') }}
          aria-label="Email address"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          className={styles.btn}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? '...' : 'SUBSCRIBE'}
        </button>
      </form>
      {err && <p className={styles.err}>{err}</p>}
      <p className={styles.note}>No spam. Unsubscribe anytime.</p>
    </div>
  )
}

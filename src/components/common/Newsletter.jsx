import { useRef, useState } from 'react'
import TurnstileWidget from './TurnstileWidget'
import styles from './Newsletter.module.css'

/**
 * Reusable newsletter signup strip.
 * Drop anywhere: <Newsletter /> 
 * Accepts optional `compact` prop for footer/sidebar use.
 */
export default function Newsletter({ compact = false }) {
  const [email, setEmail]   = useState('')
  const [trap, setTrap]     = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [err, setErr]       = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileError, setTurnstileError] = useState('')
  const [securityActive, setSecurityActive] = useState(false)
  const turnstileRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErr('Enter a valid email address.')
      return
    }

    if (!turnstileToken) {
      setTurnstileError('Complete the security check before subscribing.')
      return
    }

    setStatus('loading')
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, _trap: trap, turnstileToken }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok || !data?.ok) {
        throw new Error('Newsletter request failed')
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setErr('Signup failed. Please try again in a moment.')
    } finally {
      turnstileRef.current?.reset()
    }
  }

  if (status === 'success') {
    return (
      <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
        <div className={styles.success}>
          <span className={styles.successIcon}>✓</span>
          <p className={styles.successMsg}>
            <strong>SIGNAL RECEIVED.</strong><br />
            You&apos;re on the list. Expect transmissions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <div className={styles.header}>
          <div className={styles.eyebrow}>{"// STAY IN THE LOOP"}</div>
          <h2 className={styles.title}>SOFTCURSE TRANSMISSIONS</h2>
          <p className={styles.desc}>
            Dev updates, game launches, new tools, and dispatches from the Lab.
            No spam. No schedule. Just signal when there&apos;s something worth saying.
          </p>
        </div>
      )}
      {compact && (
        <div className={styles.compactLabel}>STAY UPDATED</div>
      )}
      <form className={styles.signup} onSubmit={handleSubmit} onFocusCapture={() => setSecurityActive(true)} noValidate>
        <div className={styles.trap} aria-hidden="true">
          <label htmlFor={`newsletter-company-${compact ? 'compact' : 'full'}`}>Company</label>
          <input
            id={`newsletter-company-${compact ? 'compact' : 'full'}`}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trap}
            onChange={e => setTrap(e.target.value)}
          />
        </div>
        <div className={styles.form}>
          <input
            type="email"
            name="email"
            className={`${styles.input} ${err ? styles.inputErr : ''}`}
            placeholder="your@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setErr('') }}
            aria-label="Email address"
            aria-invalid={Boolean(err)}
            aria-describedby={err ? `newsletter-error-${compact ? 'compact' : 'full'}` : undefined}
            autoComplete="email"
            maxLength={254}
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            className={styles.btn}
            disabled={status === 'loading' || !turnstileToken}
          >
            {status === 'loading' ? '...' : 'SUBSCRIBE'}
          </button>
        </div>
        {securityActive
          ? <TurnstileWidget ref={turnstileRef} action="newsletter" onToken={setTurnstileToken} onError={setTurnstileError} />
          : <p className={styles.note}>Security verification loads when you use this form.</p>}
      </form>
      {err && <p id={`newsletter-error-${compact ? 'compact' : 'full'}`} className={styles.err} role="alert">{err}</p>}
      {turnstileError && <p className={styles.err} role="alert">{turnstileError}</p>}
      <p className={styles.note}>No spam. Unsubscribe anytime.</p>
    </div>
  )
}

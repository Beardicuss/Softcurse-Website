import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import styles from './TurnstileWidget.module.css'

const SITE_KEY = '0x4AAAAAAEcppLKQz8r0u4P4'
let scriptPromise

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('turnstile-api')
    const script = existing || document.createElement('script')
    const loaded = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not initialize.'))
    const failed = () => { scriptPromise = null; reject(new Error('Turnstile failed to load.')) }
    script.addEventListener('load', loaded, { once: true })
    script.addEventListener('error', failed, { once: true })
    if (!existing) {
      script.id = 'turnstile-api'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      document.head.appendChild(script)
    }
  })
  return scriptPromise
}

const TurnstileWidget = forwardRef(function TurnstileWidget(
  { action, onToken, onError },
  ref,
) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const callbacksRef = useRef({ onToken, onError })

  useEffect(() => {
    callbacksRef.current = { onToken, onError }
  }, [onToken, onError])

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
      callbacksRef.current.onToken('')
    },
  }), [])

  useEffect(() => {
    let disposed = false
    const renderWidget = () => {
      if (disposed || !containerRef.current || !window.turnstile) return

      if (widgetIdRef.current !== null) return

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action,
        theme: 'dark',
        size: 'normal',
        'response-field': false,
        callback: (token) => {
          callbacksRef.current.onError('')
          callbacksRef.current.onToken(token)
        },
        'expired-callback': () => {
          callbacksRef.current.onToken('')
          callbacksRef.current.onError('Verification expired. Please try again.')
        },
        'timeout-callback': () => {
          callbacksRef.current.onToken('')
          callbacksRef.current.onError('Verification timed out. Please try again.')
        },
        'error-callback': () => {
          callbacksRef.current.onToken('')
          callbacksRef.current.onError('Verification failed to load. Please retry.')
          return true
        },
        'unsupported-callback': () => {
          callbacksRef.current.onToken('')
          callbacksRef.current.onError('This browser cannot run the security check.')
        },
      })
    }

    loadTurnstile().then(renderWidget).catch(() => {
      if (!disposed) callbacksRef.current.onError('Verification failed to load. Please retry.')
    })

    return () => {
      disposed = true
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [action])

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.widget} />
      <p className={styles.label}>SECURE TRANSMISSION CHECK</p>
    </div>
  )
})

export default TurnstileWidget

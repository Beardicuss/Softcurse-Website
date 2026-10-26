import { useState } from 'react'
import styles from './ShareButtons.module.css'

export default function ShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const enc  = encodeURIComponent
  const text = enc(`${title} — Softcurse`)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select a temporary input
      const el = document.createElement('input')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>SHARE</span>

      <a className={styles.btn}
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`}
        target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" title="Share on Facebook">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path className={styles.iconFill} d="M13.7 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V4a22 22 0 0 0-2.4-.1c-2.4 0-4.1 1.5-4.1 4.2V10H8v3h2.5v8h3.2Z" /></svg>
      </a>

      <a className={styles.btn}
        href={`https://twitter.com/intent/tweet?text=${text}&url=${enc(shareUrl)}`}
        target="_blank" rel="noopener noreferrer" aria-label="Share on X / Twitter" title="Share on X">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 14 16M19 4 5 20" /></svg>
      </a>

      <a className={styles.btn}
        href={`https://reddit.com/submit?url=${enc(shareUrl)}&title=${text}`}
        target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit" title="Share on Reddit">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7.5" /><circle cx="9" cy="12" r="1" className={styles.iconFill} /><circle cx="15" cy="12" r="1" className={styles.iconFill} /><path d="M8.5 15c1.8 1.3 5.2 1.3 7 0M14.5 5.8 16 3l3 .7M4.5 10.5a2 2 0 1 0 1.2 3.6M19.5 10.5a2 2 0 1 1-1.2 3.6" /></svg>
      </a>

      <button
        className={`${styles.btn} ${copied ? styles.copied : ''}`}
        onClick={handleCopy}
        aria-label={copied ? 'Link copied!' : 'Copy link'}
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? '✓' : <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="1.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></svg>}
      </button>

      {copied && <span className={styles.copiedLabel} role="status">COPIED!</span>}
    </div>
  )
}

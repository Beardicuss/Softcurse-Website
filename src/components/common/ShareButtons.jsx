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
        href={`https://twitter.com/intent/tweet?text=${text}&url=${enc(shareUrl)}`}
        target="_blank" rel="noopener noreferrer" aria-label="Share on X / Twitter" title="Share on X">
        𝕏
      </a>

      <a className={styles.btn}
        href={`https://reddit.com/submit?url=${enc(shareUrl)}&title=${text}`}
        target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit" title="Share on Reddit">
        ◈
      </a>

      <button
        className={`${styles.btn} ${copied ? styles.copied : ''}`}
        onClick={handleCopy}
        aria-label={copied ? 'Link copied!' : 'Copy link'}
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? '✓' : '⎘'}
      </button>

      {copied && <span className={styles.copiedLabel} role="status">COPIED!</span>}
    </div>
  )
}

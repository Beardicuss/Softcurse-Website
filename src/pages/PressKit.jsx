import { useState } from 'react'
import Button from '../components/common/Button'
import { useSEO } from '../hooks/useSEO'
import { usePageTitle } from '../hooks/usePageTitle'
import { getApps } from '../data/apps'
import { getGames } from '../data/games'
import styles from './PressKit.module.css'


function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className={styles.copyBtn + (copied ? ' ' + styles.copyBtnDone : '')} onClick={handle}>
      {copied ? '✓ COPIED' : 'COPY TEXT'}
    </button>
  )
}

export default function PressKit() {
  useSEO({ title: 'Press Kit', description: 'Softcurse press kit — brand assets, boilerplate, and press contact information.', url: '/press' })
  usePageTitle('Press Kit')

  return (
    <div>
      <div className="page-header grid-bg">
        <div className="scanline" />
        <div className="page-header__eyebrow">// FOR PRESS & MEDIA</div>
        <h1 className="page-header__title">PRESS KIT</h1>
        <p className="page-header__desc">
          Everything you need to write about Softcurse — brand assets, company info,
          boilerplate, and contacts. Take what you need.
        </p>
      </div>

      <div className="container section">

        {/* Quick download */}
        <div className={styles.downloadBar}>
          <div className={styles.downloadText}>
            <span className={styles.downloadLabel}>// PRESS PACKAGE</span>
            <p>Logo files, screenshots, and brand guidelines in one zip.</p>
          </div>
          <Button variant="cyan">DOWNLOAD PRESS PACK</Button>
        </div>

        <div className={styles.grid}>

          {/* Left column */}
          <div className={styles.left}>

            {/* Company boilerplate */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>COMPANY BOILERPLATE</h2>
              <div className={styles.copyBlock}>
                <p className={styles.copyText}>
                  Softcurse is an independent software company building tools and games at the dark
                  edge of digital craft. Operating under the banner of "a small, slightly sinister
                  digital universe," Softcurse develops productivity software, security tools, and
                  AI applications through its Lab division — alongside story-driven games through
                  Softcurse Studio. Founded in 2023, the company ships products that solve real
                  problems without compromise.
                </p>
<CopyButton text={`Softcurse is an independent software company building tools and games at the dark edge of digital craft. Operating under the banner of "a small, slightly sinister digital universe," Softcurse develops productivity software, security tools, and AI applications through its Lab division — alongside story-driven games through Softcurse Studio. Founded in 2023, the company ships products that solve real problems without compromise.`} />
              </div>
            </section>

            {/* Short boilerplate */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>SHORT VERSION (1 SENTENCE)</h2>
              <div className={styles.copyBlock}>
                <p className={styles.copyText}>
                  Softcurse is an independent company building sharp tools and dark games — a small, slightly sinister digital universe.
                </p>
<CopyButton text='Softcurse is an independent company building sharp tools and dark games — a small, slightly sinister digital universe.' />
              </div>
            </section>

            {/* Key facts */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>KEY FACTS</h2>
              <dl className={styles.facts}>
                {[
                  ['Founded',    '2023'],
                  ['HQ',         'Remote / Independent'],
                  ['Products',   '9 Lab tools, 3 Studio games'],
                  ['Stage',      'Independent / Self-funded'],
                  ['Website',    'softcurse.com'],
                  ['Email',      'press@softcurse.com'],
                  ['Twitter',    '@softcurse'],
                  ['GitHub',     'github.com/softcurse'],
                ].map(([k, v]) => (
                  <div key={k} className={styles.fact}>
                    <dt className={styles.factKey}>{k}</dt>
                    <dd className={styles.factVal}>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* Right column */}
          <div className={styles.right}>

            {/* Logo assets */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>LOGO ASSETS</h2>
              <div className={styles.logoGrid}>
                <div className={styles.logoCard} style={{ background: '#0B0C10' }}>
                  <img src="/logo.png" alt="Softcurse logo on dark" className={styles.logoPreview} />
                  <span className={styles.logoLabel}>DARK BG</span>
                </div>
                <div className={styles.logoCard} style={{ background: '#fff' }}>
                  <img src="/logo.png" alt="Softcurse logo on light" className={`${styles.logoPreview} ${styles.logoInvert}`} />
                  <span className={styles.logoLabel} style={{ color: '#333' }}>LIGHT BG</span>
                </div>
              </div>
              <div className={styles.logoFormats}>
                {['PNG (transparent)', 'SVG (vector)', 'ICO (favicon)'].map(f => (
                  <button key={f} className={styles.fmtBtn}>{f}</button>
                ))}
              </div>
            </section>

            {/* Colours */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>BRAND COLOURS</h2>
              <div className={styles.colorGrid}>
                {[
                  ['#00FFFF', 'Neon Cyan',    'PRIMARY'],
                  ['#FF00FF', 'Neon Magenta', 'SECONDARY'],
                  ['#007BFF', 'Electric Blue','ACCENT'],
                  ['#39FF14', 'Neon Green',   'STATUS'],
                  ['#0B0C10', 'Deep Charcoal','BACKGROUND'],
                  ['#1C1E26', 'Dark Slate',   'SURFACE'],
                ].map(([hex, name, role]) => (
                  <div key={hex} className={styles.colorChip}>
                    <div className={styles.colorSwatch} style={{ background: hex }} />
                    <div className={styles.colorInfo}>
                      <span className={styles.colorName}>{name}</span>
                      <span className={styles.colorHex}>{hex}</span>
                      <span className={styles.colorRole}>{role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>PRESS CONTACT</h2>
              <div className={styles.pressContact}>
                <p className={styles.pressLine}><span className={styles.pressKey}>Email</span> press@softcurse.com</p>
                <p className={styles.pressLine}><span className={styles.pressKey}>Response</span> Within 48 hours</p>
                <p className={styles.pressLine}><span className={styles.pressKey}>Embargo</span> Respected on request</p>
              </div>
              <Button variant="outline" href="/contact" className={styles.contactBtn}>
                SEND PRESS INQUIRY →
              </Button>
            </section>

          </div>
        </div>

        {/* Products quick reference */}
        <section className={styles.productsSection}>
          <h2 className={styles.sectionTitle}>PRODUCTS REFERENCE</h2>
          <div className={styles.productsGrid}>
            <div>
              <div className={styles.productsCat}>LAB TOOLS</div>
              {getApps().map(a => (
                <div key={a.id} className={styles.productRow}>
                  <span className={styles.productIcon}>{a.icon}</span>
                  <span className={styles.productName}>{a.name}</span>
                  <span className={styles.productTag}>{a.tag}</span>
                </div>
              ))}
            </div>
            <div>
              <div className={styles.productsCat}>STUDIO GAMES</div>
              {getGames().map(g => (
                <div key={g.id} className={styles.productRow}>
                  <span className={styles.productIcon}>{g.icon}</span>
                  <span className={styles.productName}>{g.name}</span>
                  <span className={styles.productTag} style={{ color:'var(--magenta)', borderColor:'rgba(255,0,255,0.25)' }}>{g.genre}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

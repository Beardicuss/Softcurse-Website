import { usePageTitle } from '../hooks/usePageTitle'
import styles from './About.module.css'
import { useSEO } from '../hooks/useSEO'

const VALUES = [
  { icon: '⚡', title: 'BUILT SHARP', body: `Every product has a clear purpose. No scope creep. No feature theater. Sharp tools for real problems — nothing more than what's needed, nothing less.` },
  { icon: '🌑', title: 'DARK BY DESIGN', body: `The aesthetic isn't accidental. We operate in the dark corners of digital craft — tools, systems, and stories that don't shy away from complexity.` },
  { icon: '🔬', title: 'LAB MENTALITY', body: `We iterate fast, break things, and rebuild better. The Lab is always running. Experiments are always in progress. Finished is never final.` },
  { icon: '🎮', title: 'WORLDS THAT MATTER', body: `Games built with intention. Every world has lore, every choice has weight, every player leaves with something they didn't expect.` },
  { icon: '🛡️', title: 'PRIVACY FIRST', body: `We don't surveil our users. Our tools respect your data. Blackwatch watches systems, not people. That line doesn't move.` },
  { icon: '🔮', title: 'ALWAYS EXPANDING', body: `The universe is growing. New tools, new games, new systems. The structure is built for infinite expansion — and we intend to fill it.` },
]

export default function About() {
  useSEO({ title: 'About', description: 'The story behind Softcurse — a small, slightly sinister digital universe built by one developer with a problem-solving obsession.', url: '/about' })
  usePageTitle('About')
  return (
    <div>
      <div className="page-header grid-bg">
        <div className="scanline" />
        <div className="page-header__eyebrow">// WHO WE ARE</div>
        <h1 className="page-header__title">ABOUT SOFTCURSE</h1>
        <p className="page-header__desc">
          A small, slightly sinister digital universe. Building tools and worlds
          with precision, purpose, and a little darkness.
        </p>
      </div>

      <div className="container section">

        {/* Mission statement */}
        <div className={styles.mission}>
          <div className={styles.missionLabel}>// MISSION</div>
          <blockquote className={styles.missionText}>
            Softcurse was born from a simple belief: the best software is built by people
            who actually use it. Every tool in the Lab was built because we needed it.
            Every game in the Studio exists because we wanted to play it. The name says it
            all — there's a dark edge here, but it's precise. We don't curse without purpose.
          </blockquote>
        </div>

        {/* Values grid */}
        <div className={styles.valuesHeader}>
          <div className="sec-header__label">// WHAT WE STAND FOR</div>
          <h2 className="sec-header__title">Core Values</h2>
        </div>

        <div className={styles.valuesGrid}>
          {VALUES.map(v => (
            <div key={v.title} className={styles.valueCard}>
              <div className={styles.valueIcon}>{v.icon}</div>
              <h3 className={styles.valueTitle}>{v.title}</h3>
              <p className={styles.valueBody}>{v.body}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
        <div className={`sec-header__label ${styles.timelineEyebrow}`}>// TIMELINE</div>
          {[
            { year: '2023', event: 'Softcurse founded. First tools shipped: YT Downloader and Vault Cleaner.' },
            { year: '2024', event: 'Lab expands: Blackwatch, DEVNOTES, and LiveScriptor launch. Studio enters development.' },
            { year: '2025', event: 'Chronicles and Isle of Quiet Men enter active dev. Media Lab AI beta begins.' },
            { year: 'NOW',  event: 'Nine lab tools. Three games. One universe. Still building.' },
          ].map(t => (
            <div key={t.year} className={styles.timelineItem}>
              <div className={styles.timelineYear}>{t.year}</div>
              <div className={styles.timelineDot} />
              <div className={styles.timelineText}>{t.event}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

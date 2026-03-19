import { useState } from 'react'
import { ROADMAP, STATUS_META } from '../data/roadmap'
import { useSEO } from '../hooks/useSEO'
import { usePageTitle } from '../hooks/usePageTitle'
import styles from './Roadmap.module.css'

const FILTERS = ['ALL', 'LAB', 'STUDIO']

export default function Roadmap() {
  useSEO({ title: 'Roadmap', description: 'The public Softcurse roadmap — upcoming tools, games, and systems in the pipeline.', url: '/roadmap' })
  usePageTitle('Roadmap')
  const [filter, setFilter] = useState('ALL')

  const filtered = ROADMAP.map(q => ({
    ...q,
    items: q.items.filter(i => filter === 'ALL' || i.type === filter)
  })).filter(q => q.items.length > 0)

  const totalDone    = ROADMAP.flatMap(q => q.items).filter(i => i.status === 'done').length
  const totalActive  = ROADMAP.flatMap(q => q.items).filter(i => i.status === 'in-progress').length
  const totalPlanned = ROADMAP.flatMap(q => q.items).filter(i => i.status === 'planned' || i.status === 'next').length

  return (
    <div>
      <div className="page-header grid-bg">
        <div className="scanline" />
        <div className="page-header__eyebrow">// WHERE WE'RE GOING</div>
        <h1 className="page-header__title">ROADMAP</h1>
        <p className="page-header__desc">
          A live view of what's shipped, what's in progress, and what's coming next
          across the Lab and Studio. No promises — just direction.
        </p>
      </div>

      <div className="container section">

        {/* Stats bar */}
        <div className={styles.stats}>
          {[
            ['SHIPPED',     totalDone,    'var(--green)'],
            ['IN PROGRESS', totalActive,  'var(--cyan)'],
            ['PLANNED',     totalPlanned, 'var(--muted)'],
          ].map(([l, n, c]) => (
            <div key={l} className={styles.stat}>
              <span className={styles.statN} style={{ color: c }}>{n}</span>
              <span className={styles.statL}>{l}</span>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`${styles.filter} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >{f}</button>
          ))}
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          {filtered.map((quarter) => (
            <div key={quarter.quarter} className={styles.quarter}>
              <div className={styles.quarterLabel}>
                <span className={styles.quarterDot} />
                {quarter.quarter}
              </div>
              <div className={styles.items}>
                {quarter.items.map(item => {
                  const meta = STATUS_META[item.status]
                  return (
                    <div key={item.id} className={`${styles.item} ${styles[item.status.replace('-','')]}`}>
                      <div className={styles.itemTop}>
                        <span className={styles.itemDot} style={{ color: meta.color }}>{meta.dot}</span>
                        <h3 className={styles.itemTitle}>{item.title}</h3>
                        <div className={styles.itemMeta}>
                          <span className={styles.itemType} style={{
                            color: item.type === 'LAB' ? 'var(--cyan)' : 'var(--magenta)',
                            borderColor: item.type === 'LAB' ? 'rgba(0,255,255,0.25)' : 'rgba(255,0,255,0.25)'
                          }}>{item.type}</span>
                          <span className={styles.itemStatus} style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                        </div>
                      </div>
                      <p className={styles.itemDesc}>{item.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

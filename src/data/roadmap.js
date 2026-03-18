/**
 * SOFTCURSE ROADMAP DATA
 * Add / edit items here. Sorted by quarter, then status.
 * status: 'done' | 'in-progress' | 'next' | 'planned'
 */

export const ROADMAP = [
  {
    quarter: 'Q3 2023',
    items: [
      { id: 'ytdl-v1',   title: 'YT Downloader v1',     type: 'LAB',    status: 'done',    desc: 'Initial release with format selection and batch download.' },
      { id: 'vault-v1',  title: 'Vault Cleaner v1',      type: 'LAB',    status: 'done',    desc: 'Deep scan engine and secure delete.' },
    ]
  },
  {
    quarter: 'Q1 2024',
    items: [
      { id: 'bw-v1',     title: 'Blackwatch v1.0',       type: 'LAB',    status: 'done',    desc: 'Process monitor, network tracking, alert system launch.' },
      { id: 'devnotes',  title: 'DEVNOTES launch',       type: 'LAB',    status: 'done',    desc: 'Markdown editor with syntax highlighting and local storage.' },
      { id: 'live-v1',   title: 'LiveScriptor v1.0',     type: 'LAB',    status: 'done',    desc: 'Real-time collaborative scriptwriting editor.' },
    ]
  },
  {
    quarter: 'Q3 2024',
    items: [
      { id: 'chron-pre', title: 'Chronicles — Pre-Alpha', type: 'STUDIO', status: 'done',    desc: 'World design, faction system, and lore framework complete.' },
      { id: 'isle-pre',  title: 'Isle of Quiet Men — Pre-Alpha', type: 'STUDIO', status: 'done', desc: 'Environment art direction and mystery design locked.' },
      { id: 'bw-v1-1',  title: 'Blackwatch v1.0.5',     type: 'LAB',    status: 'done',    desc: 'File integrity checks and scheduled scan support.' },
    ]
  },
  {
    quarter: 'Q1 2025',
    items: [
      { id: 'medialab',  title: 'Media Lab AI — Beta',   type: 'LAB',    status: 'in-progress', desc: 'AI image processing and style transfer pipeline.' },
      { id: 'inkmind',   title: 'InkMind — Beta',        type: 'LAB',    status: 'in-progress', desc: 'AI writing assistant with knowledge graph integration.' },
      { id: 'chron-a',  title: 'Chronicles — Alpha',     type: 'STUDIO', status: 'in-progress', desc: 'Playable vertical slice with faction system live.' },
    ]
  },
  {
    quarter: 'Q3 2025',
    items: [
      { id: 'archvis',   title: 'Architecture Visualizer — Alpha', type: 'LAB', status: 'next', desc: '3D WebGL renderer and CAD import pipeline.' },
      { id: 'spectral',  title: 'Softcurse Spectral — Alpha', type: 'LAB', status: 'next', desc: 'FFT signal analysis and anomaly detection engine.' },
      { id: 'isle-a',   title: 'Isle of Quiet Men — Alpha', type: 'STUDIO', status: 'next', desc: 'Survival mechanics and first mystery chapter playable.' },
    ]
  },
  {
    quarter: 'Q1 2026',
    items: [
      { id: 'ww3-pre',   title: 'WW3: Global Collapse — Pre-Alpha', type: 'STUDIO', status: 'planned', desc: 'Geopolitical engine and nation management prototype.' },
      { id: 'medialab2', title: 'Media Lab AI — v1.0',   type: 'LAB',    status: 'planned', desc: 'Full release with audio analysis and batch export.' },
      { id: 'sc-lib',    title: 'Softcurse Component Library', type: 'LAB', status: 'planned', desc: 'Shared UI package across all Lab tools.' },
    ]
  },
  {
    quarter: 'Beyond',
    items: [
      { id: 'chron-ea',  title: 'Chronicles — Early Access', type: 'STUDIO', status: 'planned', desc: 'Open world RPG early access launch.' },
      { id: 'isle-rel',  title: 'Isle of Quiet Men — Full Release', type: 'STUDIO', status: 'planned', desc: 'Complete mystery survival experience.' },
      { id: 'ww3-beta',  title: 'WW3: Global Collapse — Multiplayer Beta', type: 'STUDIO', status: 'planned', desc: 'Up to 16-player geopolitical simulation.' },
    ]
  }
]

export const STATUS_META = {
  'done':        { label: 'SHIPPED',     color: 'var(--green)',   dot: '●' },
  'in-progress': { label: 'IN PROGRESS', color: 'var(--cyan)',    dot: '◎' },
  'next':        { label: 'UP NEXT',     color: 'var(--magenta)', dot: '◆' },
  'planned':     { label: 'PLANNED',     color: 'var(--muted)',   dot: '○' },
}

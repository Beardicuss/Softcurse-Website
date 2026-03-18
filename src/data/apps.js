/**
 * SOFTCURSE LAB — Tool Definitions
 * Add new tools here. They auto-populate the Lab page, Home preview, and nav dropdown.
 */

export const APPS = {
  devnotes: {
    id: 'devnotes',
    name: 'DEVNOTES',
    icon: '📋',
    tag: 'PRODUCTIVITY',
    status: 'active', // 'active' | 'dev' | 'planned'
    shortDesc: 'Developer-focused notes with code blocks, tags, and zero distraction.',
    desc: `A developer-focused notes app built for speed and deep organization.
    Syntax highlighting, code blocks, tag systems, and a distraction-free interface
    forged for the terminal-native mind. If your notes don't support code, they're
    not developer notes.`,
    features: [
      'Markdown Editor',
      'Code Syntax Highlighting',
      'Tags & Categories',
      'Local Storage',
      'Export to PDF',
      'Offline Mode',
      'Dark Theme (only)',
      'CLI Integration',
    ],
    techStack: ['React', 'Electron', 'CodeMirror', 'IndexedDB'],
    releaseDate: '2024-06-01',
    version: '1.3.2',
  },

  medialab: {
    id: 'medialab',
    name: 'Softcurse Media Lab AI',
    icon: '🤖',
    tag: 'AI TOOL',
    status: 'dev',
    shortDesc: 'AI-powered media manipulation and generation suite for serious creators.',
    desc: `AI-powered media manipulation and generation suite. Process, enhance, and
    transform visual and audio assets with neural precision. Built for creators who
    won't settle for generic outputs. Feed it raw — get back refined.`,
    features: [
      'AI Image Enhancement',
      'Style Transfer',
      'Audio Analysis',
      'Batch Processing',
      'API Integration',
      'Real-time Preview',
      'Custom Model Import',
      'Export Pipeline',
    ],
    techStack: ['Python', 'FastAPI', 'React', 'TensorFlow', 'FFmpeg'],
    releaseDate: null,
    version: '0.6.0-beta',
  },

  archvis: {
    id: 'archvis',
    name: 'Softcurse Architecture Visualizer',
    icon: '🏗️',
    tag: 'VISUALIZATION',
    status: 'dev',
    shortDesc: 'Interactive 3D architectural visualization with a real-time WebGL engine.',
    desc: `Interactive 3D architectural visualization and diagramming tool. Design, render,
    and walk through structural layouts with a real-time WebGL engine that handles complexity
    without complaint. Drag in a CAD file. Walk through it. Export it. Simple.`,
    features: [
      '3D WebGL Renderer',
      'Import CAD / IFC Files',
      'Walk-through Mode',
      'Lighting Simulation',
      'Material Editor',
      'Annotation Layer',
      'Dimension Tools',
      'Export HD / PDF',
    ],
    techStack: ['Three.js', 'React', 'Node.js', 'WebGL'],
    releaseDate: null,
    version: '0.4.1-alpha',
  },

  livescriptor: {
    id: 'livescriptor',
    name: 'LiveScriptor',
    icon: '✍️',
    tag: 'WRITING',
    status: 'active',
    shortDesc: 'Real-time collaborative script and document editor. Write live. Ship fast.',
    desc: `Real-time collaborative script and document editor. Write screenplays, technical
    docs, and lore bibles. Collaborate live without the chaos. Publish with zero friction.
    Format enforced. Structure maintained. Your words, exactly where they need to be.`,
    features: [
      'Live Collaboration',
      'Script Templates',
      'Version History',
      'Comments & Review',
      'Multiple Export Formats',
      'Offline Mode',
      'Screenplay Mode',
      'Auto-formatting',
    ],
    techStack: ['React', 'Node.js', 'Socket.io', 'MongoDB', 'Quill.js'],
    releaseDate: '2024-03-15',
    version: '2.1.0',
  },

  blackwatch: {
    id: 'blackwatch',
    name: 'Softcurse Blackwatch',
    icon: '🔒',
    tag: 'SECURITY',
    status: 'active',
    shortDesc: 'Silent system watchdog. Monitors processes, network, and integrity — speaks only when it must.',
    desc: `System monitoring and security watchdog. Silently tracks processes, network
    activity, and system integrity. Speaks only when it needs to. When it does — you
    should listen. Blackwatch doesn't beg for your attention. It earns it.`,
    features: [
      'Process Monitor',
      'Network Activity Tracker',
      'Integrity Check Engine',
      'Alert System',
      'Log Analysis',
      'Threat Detection',
      'Scheduled Scans',
      'Report Generation',
    ],
    techStack: ['Rust', 'Tauri', 'React', 'SQLite'],
    releaseDate: '2024-08-10',
    version: '1.0.5',
  },

  spectral: {
    id: 'spectral',
    name: 'Softcurse Spectral',
    icon: '👁️',
    tag: 'ANALYSIS',
    status: 'dev',
    shortDesc: 'Advanced signal and data spectral analysis — see what others miss.',
    desc: `Advanced signal and data spectral analysis. Visualize frequencies, patterns,
    and anomalies in any data stream. Built for engineers and researchers who need to
    see what others miss. If it has a signal, Spectral can see it.`,
    features: [
      'FFT Analysis',
      'Signal Visualization',
      'Anomaly Detection',
      'Data Import / Export',
      'Custom Algorithms',
      'Report Generator',
      'Multi-channel View',
      'Real-time Feed',
    ],
    techStack: ['Python', 'NumPy', 'SciPy', 'React', 'D3.js'],
    releaseDate: null,
    version: '0.3.0-dev',
  },

  inkmind: {
    id: 'inkmind',
    name: 'Softcurse InkMind',
    icon: '🧠',
    tag: 'AI / WRITING',
    status: 'dev',
    shortDesc: 'AI writing assistant fused with a personal knowledge base. Your ideas, amplified.',
    desc: `AI writing assistant fused with a personal knowledge base. Think, write, and
    evolve your ideas with machine intelligence. Your notes, your links, your logic —
    amplified. InkMind doesn't replace your thinking. It accelerates it.`,
    features: [
      'AI Suggestions',
      'Knowledge Graph',
      'Bidirectional Linking',
      'Custom AI Prompts',
      'Export Formats',
      'Privacy Mode',
      'Concept Clustering',
      'Citation Support',
    ],
    techStack: ['React', 'Node.js', 'OpenAI API', 'PostgreSQL', 'GraphQL'],
    releaseDate: null,
    version: '0.5.0-beta',
  },

  ytdl: {
    id: 'ytdl',
    name: 'Softcurse YT Downloader',
    icon: '⬇️',
    tag: 'UTILITY',
    status: 'active',
    shortDesc: 'Clean, fast, format-flexible video and audio downloader. No bloat. No ads. No dark patterns.',
    desc: `Clean, fast, format-flexible video and audio downloader. No bloat. No ads.
    No dark patterns. Just a tool that does exactly what it says, exactly when you
    tell it to. Downloads your media. Doesn't download your data.`,
    features: [
      'Multiple Formats (MP4, MKV, WebM)',
      'Audio Extraction (MP3, FLAC, AAC)',
      'Quality Selection',
      'Playlist Support',
      'Batch Download',
      'CLI Support',
      'Metadata Embed',
      'Subtitle Download',
    ],
    techStack: ['Python', 'yt-dlp', 'Tauri', 'React'],
    releaseDate: '2023-11-01',
    version: '3.0.1',
  },

  vault: {
    id: 'vault',
    name: 'Softcurse Vault Cleaner',
    icon: '🧹',
    tag: 'UTILITY',
    status: 'active',
    shortDesc: 'Deep system cleaner. Reclaim space. Erase redundancies. Delete sensitive data. Surgical.',
    desc: `Deep system cleaner and file vault optimizer. Reclaim disk space, erase
    redundancies, and permanently delete sensitive data. Surgical. Silent. Thorough.
    Vault Cleaner doesn't ask twice. Neither should you.`,
    features: [
      'Deep Scan Engine',
      'Duplicate Finder',
      'Secure Delete (DoD 7-pass)',
      'Disk Space Analyzer',
      'Scheduled Cleans',
      'Backup Reports',
      'Registry Cleaner (Win)',
      'Safe Mode',
    ],
    techStack: ['Rust', 'Tauri', 'React'],
    releaseDate: '2023-09-20',
    version: '2.2.0',
  },
}

/**
 * Returns array of all apps, optionally filtered by status.
 * @param {'active'|'dev'|'planned'|null} status
 */
export function getApps(status = null) {
  const all = Object.values(APPS)
  return status ? all.filter(a => a.status === status) : all
}

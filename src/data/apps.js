/**
 * SOFTCURSE LAB — Tool Definitions
 * Add new tools here. They auto-populate the Lab page, Home preview, and nav dropdown.
 */

export const APPS = {
  devnotes: {
    id: 'devnotes',
    image: '/posters/apps/devnotes.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'DEVNOTES',
    icon: '📋',
    tag: 'PRODUCTIVITY',
    status: 'active',
    shortDesc: 'All-in-one desktop workspace for developers — tasks, mind maps, AI, and GitHub sync.',
    desc: `DevNotes is a unified desktop workspace that replaces your scattered tools with a single,
    purpose-built environment for developers. Manage projects, milestones, and daily standups.
    Brainstorm architecture with interactive mind maps. Draft with a built-in Claude AI assistant.
    Sync your encrypted workspace to a private GitHub Gist and work seamlessly across machines.
    Fast, native, and built to stay out of your way.`,
    features: [
      'Project & Task Management',
      'Interactive Mind Maps',
      'Built-in Claude AI Assistant',
      'GitHub Gist Sync (encrypted)',
      'Google Calendar Integration',
      'AI Standup Drafting & Auto-tagging',
      'System Tray & Global Shortcuts',
      'Native Windows — Rust Backend (Tauri v2)',
    ],
    techStack: ['React 18', 'Vite', 'Zustand', 'Tauri v2', 'Rust'],
    releaseDate: '2024-06-01',
    version: '1.3.2',
  },

  medialab: {
    id: 'medialab',
    image: '/posters/apps/medialab.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'Softcurse Media Lab AI',
    icon: '🤖',
    tag: 'AI TOOL',
    status: 'active',
    shortDesc: 'Hardware-accelerated AI image editor — watermark removal, inpainting, upscaling, and generative fill.',
    desc: `Media Lab AI is a hardware-accelerated Windows application for advanced image manipulation
    and AI-powered media processing. Remove watermarks and objects with LaMa inpainting, strip
    backgrounds, upscale with ESRGAN, and generate content with Stable Diffusion — all in one
    cyberpunk-themed workspace. DirectML GPU acceleration works on any GPU, with automatic CPU
    fallback. Supports batch video watermark removal, audio/video conversion via FFmpeg, and
    a full toolkit of quick image utilities.`,
    features: [
      'LaMa Inpainting — Object & Watermark Removal',
      'Magic Wand (Segment Anything Model)',
      'AI Background Removal & Upscaling (ESRGAN)',
      'Generative Fill via Stable Diffusion',
      'Video Watermark Removal + Audio Remux',
      'Batch AV Converter (FFmpeg)',
      'Toolkit Lab — Resize, Convert, Crop, Compare',
      'DirectML / CUDA / CPU Acceleration',
    ],
    techStack: ['WPF', '.NET 8', 'OpenCvSharp4', 'ONNX Runtime', 'FFmpeg'],
    releaseDate: '2024-01-01',
    version: '3.0',
  },

  archvis: {
    id: 'archvis',
    image: '/posters/apps/archvis.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'Softcurse Architecture Visualizer',
    icon: '🏗️',
    tag: 'DEV TOOL',
    status: 'active',
    shortDesc: 'Dependency graph visualizer for 13 languages — AST-based analysis, D3.js interactive graphs, 85% accuracy.',
    desc: `The Architecture Visualizer analyzes and maps the dependency graph of any codebase
    with 85% average parsing accuracy across 13 programming languages. Deep AST-based analyzers
    cover Python (100%), Java (95%), C# (95%), and JavaScript/TypeScript (85%). The output is an
    interactive D3.js graph with zoom, pan, node filtering, and circular dependency detection.
    81% faster than baseline with 86% less memory usage. Smart caching means only changed files
    are re-analyzed on subsequent runs.`,
    features: [
      '13 Languages — Python, C#, Java, JS, TS, Go, Rust, PHP, and more',
      'AST-Based Parsing — 85% Average Accuracy',
      'Interactive D3.js Graph with Zoom & Pan',
      'Circular Dependency Detection',
      'Smart Incremental Caching',
      '81% Faster, 86% Less Memory Than Baseline',
      'Force-Directed, Hierarchical & Circular Layouts',
      'Configurable via .visualizer.yml',
    ],
    techStack: ['Python 3.8+', 'D3.js', 'javalang', 'AST', 'PyYAML'],
    releaseDate: '2025-11-23',
    version: '2.0.0',
  },

  livescriptor: {
    id: 'livescriptor',
    image: '/posters/apps/livescriptor.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'LiveScriptor',
    icon: '✍️',
    tag: 'DEV TOOL',
    status: 'active',
    shortDesc: 'High-performance HTML/CSS/JS live editor with real-time preview, Monaco IntelliSense, and multi-workspace support.',
    desc: `LiveScriptor is a native Windows live editor built for rapid front-end prototyping.
    Write HTML, CSS, and JavaScript in a Monaco-powered editor and watch your output render
    instantly in the dual-pane preview — no browser refresh required. CSS changes inject via
    DOM diffing without a full reload. Manage entire project folders through the workspace
    explorer, work across multiple files with tabbed dirty-state tracking, and detach the
    preview window to a second monitor. IntelliSense, Emmet, and layout persistence included.`,
    features: [
      'Real-Time Preview — No Reload Required',
      'CSS Hot Module Replacement via DOM Diffing',
      'Monaco Editor with True IntelliSense (JS/TS/CSS)',
      'Emmet Abbreviations for HTML',
      'Workspace Explorer — Recursive Folder Loading',
      'Tabbed Interface with Dirty State Tracking',
      'Detachable Preview for Multi-Monitor',
      'Layout & Window Persistence Across Sessions',
    ],
    techStack: ['.NET 9', 'Windows Forms', 'Monaco Editor', 'WebView2'],
    releaseDate: '2024-03-15',
    version: '2.1.0',
  },

  blackwatch: {
    id: 'blackwatch',
    image: '/posters/apps/blackwatch.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'Softcurse Blackwatch',
    icon: '🔒',
    tag: 'SECURITY',
    status: 'active',
    shortDesc: 'Anti-cheat and system monitoring suite — real-time threat scoring, process purge, and network visibility.',
    desc: `Blackwatch is a high-performance Windows security and anti-cheat monitoring solution
    with a cyberpunk-industrial UI. It scans every 5 seconds across Enumeration, Analysis, and
    Network Correlation stages, scoring new processes instantly via WMI watcher. A holographic
    threat sphere turns red when danger is detected. One-click purge terminates all high-severity
    threats, with a dry-run safety mode to preview before acting. Full network TCP tracking,
    process explorer with kill controls, and a color-coded live log viewer.`,
    features: [
      'Automated Scanning Every 5 Seconds',
      'Instant WMI Threat Scoring (no gap)',
      '3D Holographic Threat Sphere',
      'One-Click Purge with Dry-Run Mode',
      'Real-Time Network TCP Tracking',
      'Full Process Explorer with Kill Controls',
      'Process Whitelist Manager',
      'Color-Coded Live Log Viewer',
    ],
    techStack: ['React 18', 'TypeScript', 'WPF (.NET 9)', 'WebView2', 'Framer Motion'],
    releaseDate: '2024-08-10',
    version: '1.0.5',
  },

  spectral: {
    id: 'spectral',
    image: '/posters/apps/spectral.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'Softcurse Spectral',
    icon: '👁️',
    tag: 'UTILITY',
    status: 'active',
    shortDesc: 'Wi-Fi and network optimization suite — real-time monitoring, channel analysis, one-click optimization, and router integration.',
    desc: `Spectral is a premium Wi-Fi and network optimization suite for Windows and macOS.
    Monitor live RSSI, throughput, and latency. Deep-scan 2.4 GHz, 5 GHz, and 6 GHz bands
    for channel congestion, then apply one-click optimizations — power management, DNS benchmarking,
    TCP auto-tuning, and roaming suppression — with a single UAC prompt and full rollback support.
    Auto-detects ASUS and TP-Link routers and applies the best channel automatically.
    CLI mode available for scripting and automation.`,
    features: [
      'Live RSSI, Throughput & Latency Monitoring',
      'Spectrum Scan — 2.4 / 5 / 6 GHz Channel Congestion',
      'One-Click Optimization with Suggestion Preview',
      'Full Rollback to Original Settings',
      'ASUS & TP-Link Router Auto-Integration',
      'DNS Benchmark — Cloudflare, Google, Quad9',
      'TCP Auto-Tuning & Power Management',
      'CLI Mode + macOS (Apple Silicon & Intel)',
    ],
    techStack: ['.NET 8', 'WPF', 'Avalonia UI 11.1', 'React Native (Expo)', 'ManagedNativeWifi'],
    releaseDate: '2026-01-01',
    version: '5.0.0',
  },

  inkmind: {
    id: 'inkmind',
    image: '/posters/apps/inkmind.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'Softcurse InkMind',
    icon: '🧠',
    tag: 'AI / WRITING',
    status: 'active',
    shortDesc: 'AI-powered creative writing environment — chapter generation, context memory, world-building, and native TTS.',
    desc: `InkMind is a full-featured creative writing environment with deep AI integration.
    Generate 1000+ word chapters using Full Context — characters, world bible, key events, and
    author rules all injected automatically. The Tandem Workflow drafts, critiques, and polishes
    in one loop. AI Entity Extraction scans text to auto-populate your character and world database.
    The Inquisitor checks consistency. The Sadistic Editor ruthlessly cuts weak paragraphs.
    Native Silero TTS reads chapters aloud offline. Zero-latency editor handles 10,000+ word chapters
    without slowdown.`,
    features: [
      'AI Chapter Generation with Full Context Injection',
      'Tandem Workflow — Draft → Critique → Polish',
      'AI Entity Extraction for Characters & World',
      'The Inquisitor — Consistency Checker',
      'Native Silero TTS (Offline)',
      'Zero-Latency Editor for 10,000+ Word Chapters',
      'Smart Import — DOCX, PDF, EPUB, TXT, Markdown',
      'Export for Publisher, Editor, or Audio',
    ],
    techStack: ['Python 3.10', 'Tkinter', 'Gemini API', 'Silero TTS', 'OpenRouter'],
    releaseDate: '2025-01-01',
    version: '1.1.0',
  },

  ytdl: {
    id: 'ytdl',
    image: '/posters/apps/ytdl.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'Softcurse YT Downloader',
    icon: '⬇️',
    tag: 'UTILITY',
    status: 'active',
    shortDesc: 'YouTube to MP3/MP4 downloader with playlist support, quality selection, and cyberpunk UI.',
    desc: `A clean, fast YouTube downloader with a cyberpunk neon UI. Download audio at
    128–320 kbps MP3 or video at up to 1080p MP4 — your choice, your quality. Paste any
    YouTube URL, pick your format and output folder, and hit download. Playlist mode grabs
    entire playlists in one click. Real-time neon progress bar shows speed and ETA. Auto-installs
    yt-dlp on first launch. Ships as a standalone .exe — no Python required on target machines.`,
    features: [
      'MP3 Mode — 128 / 192 / 256 / 320 kbps',
      'MP4 Mode — Best / 1080p / 720p / 480p / 360p',
      'Playlist Mode — Full Playlist in One Click',
      'Real-Time Neon Progress Bar with Speed & ETA',
      'Auto-Installs yt-dlp on First Launch',
      'Remembers Last Folder & Quality Settings',
      'Builds to Standalone .exe (no Python needed)',
      'FFmpeg Integration for MP3 Conversion & MP4 Merge',
    ],
    techStack: ['Python 3.10', 'tkinter', 'yt-dlp', 'FFmpeg'],
    releaseDate: '2023-11-01',
    version: '3.0.1',
  },

  vault: {
    id: 'vault',
    image: '/posters/apps/vault.png',  // 800×450px WebP or PNG, place in public/posters/apps/
    name: 'Softcurse Vault Cleaner',
    icon: '🧹',
    tag: 'UTILITY',
    status: 'active',
    shortDesc: 'Windows disk cleanup and analyzer — browser caches, system junk, duplicate finder, and one-click purge.',
    desc: `Vault Cleaner is an advanced Windows disk cleanup and analysis utility. Clean
    browser caches (Chrome, Edge, Firefox, Brave), Windows Update leftovers, NVIDIA and
    Unreal Engine caches, Python PIP, Android SDK images, event logs, orphaned installers,
    and more — all with real-time progress tracking and detailed logs. The Disk Analyzer
    deep-scans any drive to surface storage hogs, list the largest files, find duplicates
    by MD5 hash, and map installed program sizes. Send identified junk directly to the
    cleanup protocol with one click.`,
    features: [
      '15+ Cleanup Targets — Browser, System, GPU, Dev Tools',
      'Disk Analyzer — Deep Scan Any Drive',
      'Duplicate Finder via MD5 Hash',
      'Large File Discovery with One-Click Location',
      'Program Sizer — Space Per Installed App',
      'Quick Scan — Estimate Space Before Cleanup',
      'DISM Component Store Cleanup with ResetBase',
      'Full Operation Logging to %LOCALAPPDATA%',
    ],
    techStack: ['WPF', '.NET 8', 'C# 10', 'MVVM', 'System.Management'],
    releaseDate: '2023-09-20',
    version: '2.3',
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

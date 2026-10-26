# ⬡ SOFTCURSE WEBSITE

> A small, slightly sinister digital universe. Built with React + Vite.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Pages & Routes](#pages--routes)
6. [Design System](#design-system)
7. [Adding Content](#adding-content)
8. [Deployment — Cloudflare Pages](#deployment--cloudflare-pages)
9. [Deployment — Other Hosts](#deployment--other-hosts)

---

## Project Overview

Official website for **Softcurse** — a software company housing:

- **Softcurse Lab** — 9 tools and apps (productivity, security, AI, utilities)
- **Softcurse Studio** — 3 games in active or planned development
- **Roadmap** — public timeline across Lab and Studio
- **Press Kit** — brand assets, boilerplate, and press contact
- **Blog** — development dispatches and design decisions
- **About** — company mission, values, and timeline
- **Contact** — contact form with honeypot spam protection

Built as a fully client-side React SPA with React Router v6.

---

## Tech Stack

| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Framework   | React 18                                           |
| Build Tool  | Vite 5 (esbuild minifier)                          |
| Routing     | React Router v6                                    |
| Styling     | CSS Modules + Global CSS Variables                 |
| Fonts       | Orbitron, Share Tech Mono, Rajdhani (Google Fonts) |
| Animation   | Pure CSS keyframes                                 |
| Deployment  | Cloudflare Pages (recommended)                     |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# 1. Enter project directory
cd softcurse-website

# 2. Install dependencies
npm install

# 3. Start dev server → http://localhost:3000
npm run dev

# 4. Build for production
npm run build

# 5. Preview production build locally
npm run preview
```

---

## Project Structure

```
softcurse-website/
│
├── public/
│   ├── favicon.svg          # SVG favicon
│   ├── logo.png             # Softcurse logo (transparent PNG)
│   ├── _redirects           # Cloudflare/Netlify SPA routing fix
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/
│   ├── components/common/
│   │   ├── AppCard           # Lab tool card + CSS
│   │   ├── BackToTop         # Floating ↑ button
│   │   ├── Badge             # Status badge (LIVE / IN DEV / PLANNED)
│   │   ├── Button            # Multi-variant button (cyan/magenta/outline/ghost)
│   │   ├── ErrorBoundary     # Crash fallback UI
│   │   ├── EyeIcon           # Holographic observe/search SVG icon
│   │   ├── Footer            # Full link grid footer
│   │   ├── GameCard          # Studio game card + CSS
│   │   ├── Navbar            # Sticky nav, dropdowns, mobile hamburger
│   │   ├── Newsletter        # Email signup strip (compact + full)
│   │   ├── PageTransition    # Fade animation between routes
│   │   ├── ScrollToTop       # Scrolls to top on route change
│   │   ├── SearchBar         # Full-screen search modal (Ctrl+K)
│   │   ├── SearchButton      # Eye icon nav button
│   │   ├── ShareButtons      # Social share (X, Reddit, copy link)
│   │   ├── ThemeProvider     # Initialises data-theme at app root
│   │   └── ThemeToggle       # Holographic dark/light mode toggle
│   │
│   ├── data/
│   │   ├── apps.js           # Lab tool definitions → edit to add tools
│   │   ├── blog.js           # Blog post content → edit to add posts
│   │   ├── games.js          # Studio game definitions → edit to add games
│   │   └── roadmap.js        # Roadmap timeline data → edit to add milestones
│   │
│   ├── hooks/
│   │   ├── usePageTitle.js   # Sets document.title per route
│   │   ├── useParticles.js   # Animated neon particle canvas
│   │   ├── useSearch.js      # Searches apps, games, and posts
│   │   └── useTheme.js       # Dark/light theme with localStorage persistence
│   │
│   ├── pages/
│   │   ├── Home              # Hero, stats, Lab + Studio previews, newsletter
│   │   ├── About             # Mission, values, timeline
│   │   ├── Blog              # Filterable post grid
│   │   ├── BlogPost          # Full post + share buttons + newsletter
│   │   ├── Contact           # Form (with honeypot) + connect info
│   │   ├── NotFound          # 404 with glitch animation
│   │   ├── PressKit          # Brand assets, boilerplate, colors
│   │   ├── Roadmap           # Filterable Lab/Studio timeline
│   │   ├── lab/
│   │   │   ├── Lab           # All tools grouped by status
│   │   │   └── AppDetail     # Tool detail + related tools
│   │   └── studio/
│   │       ├── Studio        # All games
│   │       └── GameDetail    # Game detail + dev blog entries
│   │
│   ├── styles/
│   │   ├── variables.css     # All CSS custom properties (dark + light themes)
│   │   ├── animations.css    # Named @keyframes, prefers-reduced-motion guards
│   │   └── globals.css       # Reset, base styles, layout utilities, focus rings
│   │
│   ├── App.jsx               # Root router, Layout, ErrorBoundary
│   └── main.jsx              # React entry point
│
├── index.html                # Meta tags, OG, Twitter Card, anti-FOUC script
├── vercel.json               # Vercel SPA routing
├── vite.config.js            # Vite config with code splitting
├── package.json              # Node 18+ required
├── .eslintrc.cjs
└── .gitignore                # Excludes node_modules, dist, .env
```

---

## Pages & Routes

| Route           | Component    | Description                               |
|-----------------|--------------|-------------------------------------------|
| `/`             | `Home`       | Hero, stats, Lab + Studio previews        |
| `/lab`          | `Lab`        | All tools grouped by status               |
| `/lab/:id`      | `AppDetail`  | Tool detail page + related tools          |
| `/studio`       | `Studio`     | All games                                 |
| `/studio/:id`   | `GameDetail` | Game detail + dev blog                    |
| `/about`        | `About`      | Mission, values, timeline                 |
| `/contact`      | `Contact`    | Contact form + socials + careers          |
| `/blog`         | `Blog`       | Filterable post grid                      |
| `/blog/:id`     | `BlogPost`   | Full post + share buttons + newsletter    |
| `/roadmap`      | `Roadmap`    | Lab + Studio timeline, filterable         |
| `/press`        | `PressKit`   | Brand assets, boilerplate, press contact  |
| `*`             | `NotFound`   | 404 with glitch animation                 |

---

## Design System

### Color Palette (Dark Theme)

| Role            | Variable        | Value     |
|-----------------|-----------------|-----------|
| Background      | `--bg`          | `#0B0C10` |
| Panels          | `--panel`       | `#1C1E26` |
| Accent Cyan     | `--cyan`        | `#00FFFF` |
| Accent Magenta  | `--magenta`     | `#FF00FF` |
| Accent Blue     | `--blue`        | `#007BFF` |
| Neon Green      | `--green`       | `#39FF14` |
| Alert Red       | `--red`         | `#FF3B3B` |
| Text Primary    | `--txt`         | `#E5E5E5` |
| Text Muted      | `--muted`       | `#AAAAAA` |

Light theme variables are in `src/styles/variables.css` under `[data-theme="light"]`.

### Typography

| Role          | Font            | Variable         |
|---------------|-----------------|------------------|
| Headings      | Orbitron        | `--font-heading` |
| Code / Labels | Share Tech Mono | `--font-mono`    |
| Body          | Rajdhani        | `--font-body`    |

### Theme System

- Toggle in the navbar (holographic switch)
- Persisted to `localStorage` as `sc-theme`
- Respects `prefers-color-scheme` on first visit
- Anti-FOUC inline script in `index.html` prevents flash on load

### Keyboard Shortcuts

| Shortcut  | Action        |
|-----------|---------------|
| `Ctrl+K`  | Open search   |
| `Escape`  | Close search / dropdowns |

---

## Adding Content

### Add a New Lab Tool

Edit `src/data/apps.js`:

```js
mynewtool: {
  id: 'mynewtool',
  name: 'My New Tool',
  icon: '🔧',
  tag: 'CATEGORY',
  status: 'dev',           // 'active' | 'dev' | 'planned'
  shortDesc: 'One line description for cards.',
  desc: `Full description for the detail page.`,
  features: ['Feature 1', 'Feature 2'],
  techStack: ['React', 'Node.js'],
  releaseDate: null,
  version: '0.1.0-dev',
},
```

Auto-appears in: Lab page, Navbar dropdown, Footer, Home preview, Search.  
Detail page lives at `/lab/mynewtool`.

---

### Add a New Studio Game

Edit `src/data/games.js`:

```js
mygame: {
  id: 'mygame',
  name: 'My New Game',
  icon: '🎮',
  tag: 'GENRE / TYPE',
  genre: 'RPG',
  status: 'planned',
  engine: 'Unreal Engine 5',
  platforms: ['PC'],
  shortDesc: 'One line description for cards.',
  desc: `Full description for the detail page.`,
  features: ['Feature 1', 'Feature 2'],
  devBlog: [
    { date: '2025-12-01', title: 'Dev Update', excerpt: 'Short preview.' },
  ],
  releaseDate: 'TBA',
  version: null,
},
```

Detail page lives at `/studio/mygame`.

---

### Add a Blog Post

Edit `src/data/blog.js`:

```js
{
  id: 'my-post-slug',
  date: '2025-12-01',
  category: 'ENGINEERING',
  title: 'My Post Title',
  excerpt: 'Short preview shown on the grid.',
  readTime: '5 min',
  content: `
## Section Heading

Paragraph text here.

## Another Section

More content.
  `,
},
```

---

### Add a Roadmap Milestone

Edit `src/data/roadmap.js` and add an item to the relevant quarter:

```js
{
  id: 'unique-id',
  title: 'Feature Name',
  type: 'LAB',            // 'LAB' | 'STUDIO'
  status: 'planned',      // 'done' | 'in-progress' | 'next' | 'planned'
  desc: 'Short description of the milestone.',
}
```

---

## Deployment — Cloudflare Pages

**Recommended.** Free, fast, global CDN, auto-deploys on every git push.

### First-time setup

```bash
# 1. Initialise git in project folder
git init
git add .
git commit -m "initial commit"

# 2. Create a repo on GitHub (e.g. softcurse-site)
git remote add origin https://github.com/YOURNAME/softcurse-site.git
git branch -M main
git push -u origin main
```

Then in **Cloudflare Dashboard**:

```
Workers & Pages → Create → Pages → Connect to Git
→ Select: softcurse-site
→ Framework preset: Vite
→ Build command:        npm run build
→ Build output dir:     dist
→ Press Deploy
```

Cloudflare builds the site and gives you a live URL:
```
https://softcurse.pages.dev
```

### Updating the site

```bash
git add .
git commit -m "describe your change"
git push
```

Cloudflare rebuilds automatically. No manual steps.

### Custom domain (optional)

Buy `softcurse.dev` (or any domain) on Cloudflare Registrar at cost price.  
In Pages → Custom Domains → Add domain. Done in 2 minutes.

---

## Deployment — Other Hosts

### Netlify

Build command: `npm run build` · Publish dir: `dist`  
The `public/_redirects` file handles SPA routing automatically.

### Vercel

Framework preset: Vite · Output dir: `dist`  
`vercel.json` in the project root handles SPA routing.

### Self-hosted / VPS

```bash
npm run build
# Upload /dist to your server
```

Nginx config:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

*© Softcurse. Built in the dark. Shipped with purpose.*

## Administration

- [Control panel setup and operations](docs/ADMIN_PANEL.md)
- [Launch-readiness checklist](docs/LAUNCH_READINESS.md)
- [Security review](docs/SECURITY_REVIEW.md)

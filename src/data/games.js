/**
 * SOFTCURSE STUDIO — Game Definitions
 * Add new games here. They auto-populate the Studio page, Home preview, and nav dropdown.
 */

export const GAMES = {
  chess: {
    id: 'chess',
    image: '/posters/games/chess.webp',
    heroImage: '/posters/games/page/chess-page.webp',
    character: '/posters/games/chess_char.webp',
    charSize: { w: 300, h: 450 },
    name: "Softcurse's Chess",
    icon: '♟',
    tag: 'STRATEGY / DARK FANTASY',
    genre: 'Strategy',
    status: 'beta',
    engine: 'Three.js + React',
    platforms: ['Web'],
    playUrl: 'https://softcurse-chess.pages.dev',
    shortDesc: 'A free-to-play 3D chess experience set on a dark gothic battlefield suspended in the cosmos.',
    desc: `Step onto a shattered realm drifting through an endless void. Softcurse's Chess
    reimagines the classic game as a dark fantasy war — every piece is a hand-crafted 3D model
    carved from antique stone, the board is a gothic fortress floating in a procedural galaxy,
    and every capture triggers cinematic battle animations. No downloads, no accounts — the
    entire experience runs in your browser.`,
    features: [
      'Full 3D Gothic Battlefield',
      'Hand-Crafted Antique Stone Pieces',
      'Player vs AI — 4 Difficulty Tiers',
      'Online PvP via Room Codes',
      'Local PvP — Pass & Play',
      'AI vs AI Spectator Mode',
      'Cinematic Battle Animations',
      'Asset-Based Audio & Ambient Soundscape',
      'Procedural Galaxy Skybox',
      'Mobile & Tablet Ready',
      'Auto-Save & ELO Rating System',
    ],
    devBlog: [],
    releaseDate: '2026 — Open Beta',
    version: 'beta',
  },

  fakechecker: {
    id: 'fakechecker',
    image: '/posters/games/fakechecker.webp',
    heroImage: '/posters/games/page/fakechecker-page.webp',
    heroPosition: 'center',
    character: '/posters/games/fakechecker-char.webp',
    charSize: { w: 340, h: 340 },
    characterName: 'Ministry of Verity',
    name: 'Fake Checker',
    icon: '◉',
    tag: 'SIMULATION / DYSTOPIAN',
    genre: 'Simulation',
    status: 'active',
    engine: 'React + Vite',
    platforms: ['Web'],
    playUrl: 'https://fakechecker.pages.dev/',
    launchLabel: 'ENTER THE MINISTRY',
    shortDesc: 'Inspect the evidence. Follow shifting directives. Decide what the Ministry is willing to call true.',
    desc: `You are an information officer inside the Ministry of Verity. Review incoming
    Information Packages, weigh conflicting evidence, and approve or reject each report before
    the quota closes. Directives change, emergencies interrupt the routine, and every decision
    affects your trust score. The truth matters — but the Ministry decides what truth means.`,
    features: [
      'Evidence-Based Information Review',
      'Approve, Reject & Classification Decisions',
      'Shifting Ministry Directives',
      'Trust Score & Daily Quotas',
      'Emergency Events & Minigames',
      'Workstation Upgrades',
      'Branching Progression',
      'CRT Interface & Reactive Audio',
      'Instant Browser Play',
    ],
    devBlog: [],
    releaseDate: '2026 — Live',
    version: '0.1.0',
  },

  hexbrewers: {
    id: 'hexbrewers',
    image: '/posters/games/hexbrewers.webp',
    heroImage: '/posters/games/page/hexbrewers-page.webp',
    heroPosition: 'center',
    character: '/posters/games/hexbrewers-char.webp',
    charSize: { w: 320, h: 320 },
    characterName: "The Brewer's Bag",
    name: 'HexBrewers from Ashenveil',
    icon: '⚗',
    tag: 'BAG-BUILDING / DARK FANTASY',
    genre: 'Strategy',
    status: 'dev',
    engine: 'React + Pixi.js',
    platforms: ['Web'],
    ctaLabel: 'IN DEVELOPMENT',
    ctaDisabled: true,
    shortDesc: 'Brew from a cursed bag, press your luck, and outscore the Shade before the ninth omen falls.',
    desc: `Build a bag of volatile ingredients and draw them into a spiraling crucible.
    Every token can strengthen the brew — or push its Voidshards past the breaking point.
    Survive the omen, score prestige, trade soulstones at the Black Market, and adapt
    your recipe across nine rounds while the Shade changes strategy against you.`,
    features: [
      'Dark Fantasy Bag-Building Strategy',
      'Nine-Round Omen Campaign',
      'Push-Your-Luck Crucible Brewing',
      'Ingredient Tokens & Recipe Books',
      'Adaptive AI Opponent — The Shade',
      'Black Market Upgrades',
      'Prestige & Soulstone Economy',
      'Pixi.js Particles & Token Animation',
      'English, Georgian & Russian',
      'Reactive Audio & Settings',
    ],
    devBlog: [],
    releaseDate: 'TBA',
    version: '0.1.0',
  },

  chronicles: {
    id: 'chronicles',
    image: '/posters/games/chronicles.webp',
    heroImage: '/posters/games/page/chronicles-page.webp',
    character: '/posters/games/chronicles-char.webp',
    charSize: { w: 300, h: 450 },
    characterName: 'The Auditor',  // transparent PNG, ~300px tall  // 800×450px WebP or PNG, place in public/posters/games/
    name: 'Chronicles of a Fallen World',
    icon: '🌑',
    tag: 'RPG / DARK FANTASY',
    genre: 'RPG',
    status: 'dev',
    engine: 'Unity',
    platforms: ['PC', 'Console (TBA)'],
    shortDesc: 'A sprawling dark fantasy RPG in a world teetering on oblivion.',
    desc: `A sprawling dark fantasy RPG set in a world teetering on the edge of oblivion.
    Every choice echoes through a fractured realm of crumbling empires, dark gods, and
    desperate survivors. There are no heroes here — only those who endure.
    The world remembers everything you do. So do its inhabitants.`,
    features: [
      'Open World Exploration',
      'Branching Narrative',
      'Faction Reputation System',
      'Dynamic Weather & Seasons',
      'Crafting & Alchemy',
      'Co-op Multiplayer (4 players)',
      'Procedural Dungeons',
      'Moral Consequence Engine',
    ],
    devBlog: [
      {
        date: '2025-10-28',
        title: 'World-Building Update: The Faction System',
        excerpt: 'The lore just got deeper. A look at faction politics and the consequences of allegiance.',
      },
      {
        date: '2025-09-05',
        title: 'Combat Design Philosophy',
        excerpt: 'Why we built combat around exhaustion rather than health — and why it makes everything better.',
      },
    ],
    releaseDate: 'TBA',
    version: '0.7.0-dev',
  },

  isle: {
    id: 'isle',
    image: '/posters/games/isle.webp',
    heroImage: '/posters/games/page/isle-page.webp',
    character: '/posters/games/isle-char.webp',
    charSize: { w: 300, h: 450 },
    characterName: 'The Stranger',  // transparent PNG, ~300px tall  // 800×450px WebP or PNG, place in public/posters/games/
    name: 'Isle of Quiet Men',
    icon: '🏝️',
    tag: 'SURVIVAL / MYSTERY',
    genre: 'Survival',
    status: 'planned',
    engine: 'Unreal Engine 5',
    platforms: ['PC'],
    shortDesc: 'Stranded on an island with secrets buried deeper than the sand.',
    desc: `Stranded on an island with secrets buried deeper than the sand. Survive
    the elements, unravel the mysteries left behind by those who came before, and
    decide whether the truth is worth the cost. Some things are buried for a reason.
    You're about to find out what.`,
    features: [
      'Survival Mechanics (Food, Water, Shelter)',
      'Mystery & Puzzle Design',
      'Dynamic Day/Night Cycle',
      'NPC Backstories & Journal Entries',
      'Multiple Endings',
      'Atmospheric Horror Elements',
      'Resource Crafting',
      'Exploration Focus',
    ],
    devBlog: [
      {
        date: '2025-08-14',
        title: 'Environment Art Direction',
        excerpt: 'How we made the island feel alive — and wrong — at the same time.',
      },
    ],
    releaseDate: 'TBA',
    version: '0.4.0-alpha',
  },

  ww3: {
    id: 'ww3',
    image: '/posters/games/ww3.webp',
    heroImage: '/posters/games/page/ww3-page.webp',
    heroPosition: 'center',
    character: '/posters/games/ww3-char.webp',
    charSize: { w: 300, h: 300 },
    // transparent PNG, ~300px tall  // 800×450px WebP or PNG, place in public/posters/games/
    name: 'World War III: Global Collapse',
    icon: '🌍',
    tag: 'STRATEGY / SIMULATION',
    genre: 'Strategy',
    status: 'dev',
    engine: 'Custom Engine',
    platforms: ['PC'],
    shortDesc: 'Command nations. Manage resources. Prevent — or cause — global annihilation.',
    desc: `Command nations. Manage resources. Prevent — or cause — global annihilation.
    A brutal geopolitical strategy simulation where every alliance has a price and
    every border is negotiable. Victory is not guaranteed. Survival might not be either.
    The board is the planet. The pieces are nations. The clock is ticking.`,
    features: [
      'Nation Management & Policy',
      'Real-time Conflict System',
      'Diplomacy & Intelligence',
      'Economic Warfare',
      'Nuclear Deterrence Mechanics',
      'Online Multiplayer (Up to 16)',
      'Intelligence & Espionage',
      'Historical Scenarios',
    ],
    devBlog: [],
    releaseDate: 'TBA',
    version: null,
  },
}

/**
 * Returns array of all games, optionally filtered by status.
 * @param {'active'|'dev'|'planned'|null} status
 */
export function getGames(status = null) {
  const all = Object.values(GAMES)
  return status ? all.filter(g => g.status === status) : all
}

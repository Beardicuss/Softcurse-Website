/**
 * SOFTCURSE STUDIO — Game Definitions
 * Add new games here. They auto-populate the Studio page, Home preview, and nav dropdown.
 */

export const GAMES = {
  chess: {
    id: 'chess',
    image: '/posters/games/chess.png',
    character: '/posters/games/chess_char.png',
    charSize: { w: 300, h: 450 },
    name: "Softcurse's Chess — Angels vs Demons",
    icon: '♟',
    tag: 'STRATEGY / DARK FANTASY',
    genre: 'Strategy',
    status: 'beta',
    engine: 'Three.js + React',
    platforms: ['Web'],
    playUrl: 'https://softcurse-chess.pages.dev',
    shortDesc: 'A free-to-play 3D chess experience where celestial Angels clash against infernal Demons on a gothic battlefield.',
    desc: `Step onto a shattered realm suspended between heaven and hell. Softcurse's Chess
    reimagines the classic game as a dark fantasy war — every piece is a hand-crafted 3D model,
    the board is a gothic fortress floating in a procedural galaxy, and every capture triggers
    cinematic battle animations. Choose your allegiance: command the radiant Angels or lead the
    twisted Demons. No downloads, no accounts — the entire experience runs in your browser.`,
    features: [
      'Full 3D Gothic Battlefield',
      'Hand-Crafted Angel & Demon Pieces',
      'Player vs AI — 4 Difficulty Tiers',
      'Online PvP via Room Codes',
      'Local PvP — Pass & Play',
      'AI vs AI Spectator Mode',
      'Cinematic Battle Animations',
      'Procedural Sound & Galaxy Skybox',
      'Mobile & Tablet Ready',
      'Auto-Save & Undo System',
    ],
    devBlog: [],
    releaseDate: '2026 — Open Beta',
    version: 'beta',
  },

  chronicles: {
    id: 'chronicles',
    image: '/posters/games/chronicles.png',
    character: '/posters/games/chronicles-char.png',
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
    image: '/posters/games/isle.png',
    character: '/posters/games/isle-char.png',
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
    image: '/posters/games/ww3.png',
    character: '/posters/games/ww3-char.png',
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

/**
 * Chronicles — Softcurse Studio sub-module.
 * Multi-POV narrative system and interactive book visualization.
 *
 * Chapter HTML files go in:
 *   public/chronicles/{bookId}/chapter-01.html
 *   public/chronicles/{bookId}/chapter-02.html
 *   etc.
 *
 * Poster image:     public/posters/chronicles/{id}.png
 * Hologram image:   public/posters/chronicles/{id}-char.png
 */

export const CHRONICLES = {
  'black-ledger': {
    id: 'black-ledger',
    series: 'Chronicles of a Fallen World',
    book: 'Book IV',
    name: 'Auditor: Black Ledger',
    image: '/posters/chronicles/black-ledger.png',
    character: '/posters/chronicles/black-ledger-char.png',
    characterName: 'The Auditor',
    charSize: { w: 300, h: 450 },
    genre: 'Dark Fantasy',
    platforms: ['Chronicles'],
    engine: 'Multi-POV Narrative',
    status: 'dev',
    tag: 'DARK FANTASY',
    releaseDate: 'TBA',
    version: null,
    shortDesc: 'A debt is never truly paid. The Auditor has come to collect what was promised — and the city of Ash will remember the price.',
    desc: `Book IV of Chronicles of a Fallen World. The Auditor arrives in the City of Ash to settle
    an ancient debt written in blood and silence. A multi-POV narrative told from the perspectives
    of those who owe, those who collect, and those who simply survive the ledger's closing.
    Each chapter is a lens. Each POV shifts the truth.`,
    features: [
      'Multi-POV narrative — same events from different eyes',
      'Interactive chapter visualization',
      'Character relationship mapping',
      'Timeline tracking across perspectives',
    ],
    devBlog: [],
    chapters: [
      {
        num: 1,
        title: 'The Price of Dawn',
        file: '/chronicles/black-ledger/chapter-01.html',
        pov: 'The Auditor',
        status: 'published',
      },
      {
        num: 2,
        title: 'The Gardener of Dead Flowers',
        file: '/chronicles/black-ledger/chapter-02.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 3,
        title: 'Architecture of Silence',
        file: '/chronicles/black-ledger/chapter-03.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 4,
        title: 'Mechanics of Flesh',
        file: '/chronicles/black-ledger/chapter-04.html',
        pov: 'Unknown',
        status: 'published',
      },
    ],
  },
}

export function getChronicles() {
  return Object.values(CHRONICLES)
}

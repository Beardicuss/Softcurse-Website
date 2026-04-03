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
    series: 'Chronicles of the Fallen World',
    book: 'Book IV',
    name: 'The Black Ledger',
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
    desc: `Set 1,000 years after the events of Books I–III, The Black Ledger opens in an Ash City
    that has rebuilt itself on the bones of the old world — and on the debts it never repaid.
    The Auditor arrives not as a conqueror, but as a collector. What follows is a reckoning
    told through the eyes of those who owe, those who survived, and those who built the new
    order on the silence of the fallen. This is not a war story. It is an accounting.`,
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
      {
        num: 5,
        title: 'Liturgy of Steel',
        file: '/chronicles/black-ledger/chapter-05.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 6,
        title: 'Debit, Credit & Void-Blossom Tea',
        file: '/chronicles/black-ledger/chapter-06.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 7,
        title: 'Velvet, Poison & Bets on Zero',
        file: '/chronicles/black-ledger/chapter-07.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 8,
        title: 'Sector 13: The Graveyard of a Thousand Masts',
        file: '/chronicles/black-ledger/chapter-08.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 9,
        title: 'The Ebony Cane',
        file: '/chronicles/black-ledger/chapter-09.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 10,
        title: 'Porcelain and Bones',
        file: '/chronicles/black-ledger/chapter-10.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 11,
        title: 'Dust on the Lips of Saints',
        file: '/chronicles/black-ledger/chapter-11.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 12,
        title: 'The Navigator of the Abyss',
        file: '/chronicles/black-ledger/chapter-12.html',
        pov: 'Unknown',
        status: 'published',
      },
      {
        num: 13,
        title: 'The Sea of the Sleeping',
        file: '/chronicles/black-ledger/chapter-13.html',
        pov: 'Unknown',
        status: 'published',
      },
    ],
  },
}

export function getChronicles() {
  return Object.values(CHRONICLES)
}

/**
 * Chronicles — Softcurse Studio sub-module.
 *
 * Poster images:    public/posters/chronicles/cotf/{pt}/
 * Chapter HTML:     public/chronicles/black-ledger/{pt}/chapter-01.html ...
 */

export const CHRONICLES = {
  'black-ledger': {
    id: 'black-ledger',
    series: 'Chronicles of the Fallen World',
    book: 'Book IV',
    name: 'The Black Ledger',
    image: '/posters/chronicles/cotf/pt1/black-ledger.png',
    character: '/posters/chronicles/cotf/pt1/black-ledger-char.png',
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
      { num: 1,  title: 'The Price of Dawn',                          file: '/chronicles/black-ledger/pt1/chapter-01.html', status: 'published' },
      { num: 2,  title: 'The Gardener of Dead Flowers',               file: '/chronicles/black-ledger/pt1/chapter-02.html', status: 'published' },
      { num: 3,  title: 'Architecture of Silence',                    file: '/chronicles/black-ledger/pt1/chapter-03.html', status: 'published' },
      { num: 4,  title: 'Mechanics of Flesh',                         file: '/chronicles/black-ledger/pt1/chapter-04.html', status: 'published' },
      { num: 5,  title: 'Liturgy of Steel',                           file: '/chronicles/black-ledger/pt1/chapter-05.html', status: 'published' },
      { num: 6,  title: 'Debit, Credit & Void-Blossom Tea',           file: '/chronicles/black-ledger/pt1/chapter-06.html', status: 'published' },
      { num: 7,  title: 'Velvet, Poison & Bets on Zero',              file: '/chronicles/black-ledger/pt1/chapter-07.html', status: 'published' },
      { num: 8,  title: 'Sector 13: The Graveyard of a Thousand Masts', file: '/chronicles/black-ledger/pt1/chapter-08.html', status: 'published' },
      { num: 9,  title: 'The Ebony Cane',                             file: '/chronicles/black-ledger/pt1/chapter-09.html', status: 'published' },
      { num: 10, title: 'Porcelain and Bones',                        file: '/chronicles/black-ledger/pt1/chapter-10.html', status: 'published' },
      { num: 11, title: 'Dust on the Lips of Saints',                 file: '/chronicles/black-ledger/pt1/chapter-11.html', status: 'published' },
      { num: 12, title: 'The Navigator of the Abyss',                 file: '/chronicles/black-ledger/pt1/chapter-12.html', status: 'published' },
      { num: 13, title: 'The Sea of the Sleeping',                    file: '/chronicles/black-ledger/pt1/chapter-13.html', status: 'published' },
      { num: 14, title: 'Voice Without a Tongue',                     file: '/chronicles/black-ledger/pt1/chapter-14.html', status: 'published' },
      { num: 15, title: 'Rotten Water',                               file: '/chronicles/black-ledger/pt1/chapter-15.html', status: 'published' },
      { num: 16, title: 'Steel Bone',                                  file: '/chronicles/black-ledger/pt1/chapter-16.html', status: 'published' },
      { num: 17, title: 'Resonance',                                   file: '/chronicles/black-ledger/pt1/chapter-17.html', status: 'published' },
      { num: 18, title: 'Force Majeure',                               file: '/chronicles/black-ledger/pt1/chapter-18.html', status: 'published' },
      { num: 19, title: 'Calibration',                                 file: '/chronicles/black-ledger/pt1/chapter-19.html', status: 'published' },
      { num: 20, title: 'Cold Calculation',                            file: '/chronicles/black-ledger/pt1/chapter-20.html', status: 'published' },
      { num: 21, title: 'Ice Contract',                                file: '/chronicles/black-ledger/pt1/chapter-21.html', status: 'published' },
      { num: 22, title: 'Living Workshop',                             file: '/chronicles/black-ledger/pt1/chapter-22.html', status: 'published' },
      { num: 23, title: 'Black Skin',                                  file: '/chronicles/black-ledger/pt1/chapter-23.html', status: 'published' },
      { num: 24, title: 'Black Import',                                file: '/chronicles/black-ledger/pt1/chapter-24.html', status: 'published' },
      { num: 25, title: 'Velvet Front',                                file: '/chronicles/black-ledger/pt1/chapter-25.html', status: 'published' },
      { num: 26, title: 'Shadow War',                                  file: '/chronicles/black-ledger/pt1/chapter-26.html', status: 'published' },
      { num: 27, title: 'Margin Call',                                 file: '/chronicles/black-ledger/pt1/chapter-27.html', status: 'published' },
    ],
  },

  'empire-of-shadows': {
    id: 'empire-of-shadows',
    series: 'Chronicles of the Fallen World',
    book: 'Book IV',
    name: 'Auditor: Empire of Shadows',
    image: '/posters/chronicles/cotf/pt2/black-ledger_pt2.png',
    character: '/posters/chronicles/cotf/pt2/black-ledger-char2.png',
    characterName: 'The Auditor',
    charSize: { w: 300, h: 450 },
    genre: 'Dark Fantasy',
    platforms: ['Chronicles'],
    engine: 'Multi-POV Narrative',
    status: 'dev',
    tag: 'DARK FANTASY',
    releaseDate: 'TBA',
    version: null,
    shortDesc: "The ledger is closed. The empire remains. The Auditor's work is far from over.",
    desc: `The second POV volume of Book IV. Where The Black Ledger counted the cost,
    Empire of Shadows maps the architecture of what was built on those bones.
    The Auditor moves deeper into the power structure of Ash City — not as a collector now,
    but as something the city cannot yet name.`,
    features: [
      'Multi-POV narrative — same events from different eyes',
      'Interactive chapter visualization',
      'Character relationship mapping',
      'Timeline tracking across perspectives',
    ],
    devBlog: [],
    chapters: [
      { num: 1, title: 'Dead Capital',   file: '/chronicles/black-ledger/pt2/chapter-01.html', status: 'published' },
      { num: 2, title: 'Black Registry', file: '/chronicles/black-ledger/pt2/chapter-02.html', status: 'published' },
    ],
  },
}

export function getChronicles() {
  return Object.values(CHRONICLES)
}

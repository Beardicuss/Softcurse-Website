/**
 * SOFTCURSE BLOG — Post Definitions
 * Add new posts here. They auto-populate the Blog page.
 */

export const POSTS = [
  {
    id: 'building-the-lab',
    date: '2025-11-14',
    category: 'ENGINEERING',
    title: 'Building the Softcurse Lab: Architecture Decisions',
    excerpt: `How we structured our tooling ecosystem for maximum modularity — and why we
    refused to compromise coherence for speed. Every tool is isolated. Every tool is connected.`,
    readTime: '7 min',
    content: `
## Why Architecture Matters for a Lab

The Lab started as a handful of scripts. Then it became apps. Then it became a philosophy.

When you're building nine tools that share a common identity but solve completely different
problems, the question isn't "how do we build this feature?" — it's "what glue holds all
of this together without making it brittle?"

Our answer was simple: **shared design tokens, independent build pipelines, and zero
cross-tool runtime dependencies.** Each tool lives in its own repo. Each tool ships on
its own schedule. But they all speak the same visual language.

## The Token System

Softcurse uses a central design token file — \`variables.css\` — that defines every color,
spacing unit, font, and animation curve. Any tool that imports it instantly looks and feels
like Softcurse, even if it was built six months later by someone who never saw the others.

This isn't new. But it works. And that's the point.

## What's Next

The next step is a shared component library — a private NPM package that every Softcurse
tool can pull in. NavBar, Badge, Card, Button. Things that should be identical everywhere.
We're building it now. It'll ship with Blackwatch 2.0.
    `,
  },
  {
    id: 'chronicles-faction-system',
    date: '2025-10-28',
    category: 'STUDIO',
    title: 'Chronicles of a Fallen World: World-Building Update',
    excerpt: `The lore just got deeper. A look at the faction system and the far-reaching
    consequences of choosing allegiance in a world that doesn't forgive.`,
    readTime: '5 min',
    content: `
## Factions in a Fallen World

When we started designing Chronicles, we knew we didn't want a good/evil axis.
The world has already fallen. There's no clear enemy. There are only groups of people
trying to survive — and they all have very different ideas about how to do that.

The faction system is built around **reputation over time** rather than binary choices.
Every interaction shifts the needle. Some shifts are visible. Some aren't.

## The Four Factions

**The Warden Order** — enforcers of the old laws. They believe civilization can be
rebuilt on the foundations of what came before. Strict. Efficient. Not wrong, exactly.

**The Ashbound** — refugees who've stopped waiting for rescue. They build where they
stand. Scrappy, loyal, and deeply suspicious of anyone who looks too clean.

**The Pale Covenant** — scholars and archivists trying to understand why the world fell.
They're not political. They're dangerous in a different way: they know things.

**The Hollow** — those who decided the old world needed to stay dead. They don't have
leaders. They have intent.

You can work with all of them. You can betray all of them. What you can't do is pretend
it doesn't matter.
    `,
  },
  {
    id: 'inkmind-ai-writing',
    date: '2025-10-01',
    category: 'LAB',
    title: 'InkMind: Merging AI With the Creative Process',
    excerpt: `Why AI writing tools get creativity wrong — and how InkMind is designed
    to fix that at the root. Your ideas should stay yours.`,
    readTime: '6 min',
    content: `
## The Problem with AI Writing Tools

Most AI writing tools have the same flaw: they want to write *for* you.
They complete your sentences before you know what you're saying. They summarize
your notes into something cleaner — and blander — than the original.

InkMind is built on a different principle: **AI should amplify your thinking,
not replace it.**

## What That Looks Like in Practice

InkMind's knowledge graph keeps track of what *you've* written. When you start a
new document, it doesn't pull from the internet. It pulls from *you*.

Its AI suggestions are offered, not applied. You see them in the margin. You decide
if they're useful. If they're not, they disappear. The cursor stays yours.

## Privacy Mode

In Privacy Mode, nothing leaves your device. The knowledge graph lives in IndexedDB.
The AI runs locally via a small quantized model. Slower. But yours.

We think that matters.
    `,
  },
  {
    id: 'blackwatch-design-philosophy',
    date: '2025-09-15',
    category: 'LAB',
    title: 'Blackwatch: The Design Philosophy of Quiet Vigilance',
    excerpt: `Security software should be silent until it needs to speak. Here's how
    Blackwatch was built around that principle from the ground up.`,
    readTime: '4 min',
    content: `
## Why Quiet?

Security tools love to remind you they're running. Badges. Animations. Constant
"everything's fine" notifications that tell you nothing except that the software
is alive and wants attention.

Blackwatch was built with the opposite philosophy: **silence is the signal of safety.**

When you don't hear from Blackwatch, nothing has happened. When you do — you should stop.

## What It Watches

Blackwatch monitors three layers: **process integrity** (what's running and whether
it should be), **network activity** (what's talking and where it's talking to), and
**file system integrity** (whether protected files have been touched).

It doesn't watch *you.* Your documents stay yours. It watches the *system.*

## The Alert System

There are only three alert levels. Info, Warning, Critical. Info doesn't make a sound.
Warning makes one quiet sound, once. Critical wakes you up. That's it.

No alert fatigue. No crying wolf. When Blackwatch speaks, you listen.
    `,
  },
]

/**
 * Returns a single post by id
 * @param {string} id
 */
export function getPost(id) {
  return POSTS.find(p => p.id === id) || null
}

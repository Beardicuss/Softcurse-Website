/**
 * SOFTCURSE BLOG — Post Definitions
 * Add new posts here. They auto-populate the Blog page.
 */

export const POSTS = [
  {
    id: 'blackwatch-early-alpha-release',
    date: '2026-09-15',
    category: 'RELEASES',
    title: 'Blackwatch 0.1.0: The Early Alpha Is Live',
    excerpt: `The first public Blackwatch build brings local process and network visibility,
    explainable evidence, and guarded response controls to Windows.` ,
    readTime: '4 min',
    content: `
## A First Public Look at Blackwatch

Blackwatch 0.1.0 is now available as an early-alpha build for Windows x64. It is a local monitoring tool designed to make active processes and TCP connections easier to inspect without hiding the evidence behind a single unexplained score.

The release shows live CPU, memory, process, and connection activity. Process details can include the executable path, SHA-256 hash, publisher, and signature information. Heuristic findings are presented as evidence for the user to review.

## Guardrails Come First

Response controls require confirmation, and Dry-Run Mode is enabled by default. Trusted-application entries are bound to application identity rather than only a display name. Diagnostic exports redact private data where possible.

Blackwatch is not an antivirus and does not replace Microsoft Defender or another reputable security product. It is an additional inspection layer, and this first build should be treated as evaluation software.

## Download Options

The release includes an installer and a portable ZIP. Both are unsigned early-alpha builds, so Windows may show an Unknown publisher or SmartScreen warning. Verify the SHA-256 checksum shown on the Blackwatch page before running a downloaded file.
    `,
  },
  {
    id: 'vault-cleaner-public-beta',
    date: '2026-09-15',
    category: 'RELEASES',
    title: 'Vault Cleaner 1.0.0 Enters Public Beta',
    excerpt: `A Windows cleanup and disk-analysis tool built around exact previews,
    protected-path validation, and recoverable deletion.` ,
    readTime: '4 min',
    content: `
## Cleanup You Can Review

Softcurse Vault Cleaner 1.0.0 is now available as a public beta for Windows 10 and 11. The central rule is simple: cleanup should be deliberate. The application previews exact targets before removal and rejects protected paths, unsafe roots, junctions, and mount points.

Supported filesystem cleanup is sent to the Recycle Bin so mistakes remain recoverable. The app runs as a standard user and requests elevation only for optional Windows component maintenance.

## More Than Temporary Files

Vault Cleaner can analyze drives or selected folders, identify unusually large files, and find duplicates. HTML storage reports make the results easier to review outside the application.

The beta installer is hosted on GitHub Releases. It is not digitally signed yet, so Windows may display an Unknown publisher or SmartScreen warning. Compare the downloaded file with the SHA-256 checksum published on the product page before installation.
    `,
  },
  {
    id: 'media-lab-ai-v1-release',
    date: '2026-09-15',
    category: 'RELEASES',
    title: 'Softcurse Media Lab AI 1.0 Is Available',
    excerpt: `The Windows media workspace combines image retouching, video cleanup,
    and audio/video conversion, with optional generative tools.` ,
    readTime: '4 min',
    content: `
## One Workspace for Practical Media Tasks

Softcurse Media Lab AI 1.0 is available for Windows x64. Its core is a local media editor for image retouching, object and watermark removal, background work, video cleanup, and audio/video conversion.

The desktop application is built with WPF and .NET 8. ONNX Runtime, DirectML, OpenCV, and FFmpeg provide the processing foundation. Despite the name, generative AI is optional rather than the product category or a requirement for the main editing workflow.

## Local Core, Optional Extensions

The editor, Toolkit Lab, local processing tools, and bundled FFmpeg workflow work without an external AI service. Users who want generative features can connect a trusted Stable Diffusion WebUI-compatible API.

The first release date is July 12, 2025. The current Windows installer and its SHA-256 checksum are available from the Media Lab product page.
    `,
  },
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
]

/**
 * Returns a single post by id
 * @param {string} id
 */
export function getPost(id) {
  return POSTS.find(p => p.id === id) || null
}

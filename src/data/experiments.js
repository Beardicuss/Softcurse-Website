/**
 * Experiments — Softcurse Lab sub-module.
 * A sandbox for half-built ideas, proof-of-concepts, and things
 * that don't fit anywhere else yet. No promises. No deadlines.
 * Just things that felt worth building.
 */

export const EXPERIMENTS = {
  sebas: {
    id: 'sebas',
    image: '/posters/experiments/sebas.png',
    name: 'S.E.B.A.S',
    icon: '🜄',
    tag: 'AUTONOMOUS AI',
    status: 'dev',
    shortDesc: 'A fully local autonomous system assistant — voice control, deep OS integration, skill forge, and an Empire architecture that grows with every command.',
    desc: `S.E.B.A.S (Stage 3: The Empire) is a fully local, modular autonomous assistant
    that lives inside your machine — not in a cloud, not on a server. It binds to your OS,
    speaks when spoken to, and builds new skills when commanded. The Empire Model organizes
    it into Archons (Speech, Vision, Knowledge, Integration), Generals (LLM, STT, TTS),
    and a ForgeMaster that generates new abilities from voice commands alone.
    Shadow Memory via RAG means it remembers everything you've ever told it.
    It does not need the internet. It does not report home. It obeys one master.`,
    features: [
      'Empire Architecture — Emperor, Archons, Generals, Wardens',
      'The Forge — generates new skills from voice commands via LLM',
      'Shadow Memory (RAG) — persistent knowledge across all sessions',
      'Intent Weaving Engine — tone, semantics, context, history parsing',
      'Voice Bindings — fully configurable TTS and STT pipeline',
      'REST Gate — authenticated API for external automations',
      'Self-Healing Watchers — auto-restarts dead services',
      'Multi-provider LLM — OpenAI, Gemini, Ollama, OpenRouter, Grok',
    ],
    techStack: ['Python', 'LangChain', 'SQLite', 'Telegram Bot API', 'FastAPI', 'Whisper STT', 'Coqui TTS'],
    releaseDate: null,
    version: '3.0-empire',
  },
}

export function getExperiments() {
  return Object.values(EXPERIMENTS)
}

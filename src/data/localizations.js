/**
 * Fan localization and modding work.
 * These entries describe Softcurse-created modifications, not original games.
 */
export const LOCALIZATIONS = {
  blasphemousGeorgian: {
    id: 'blasphemous-georgian',
    image: '/posters/localization/blasphemous-georgian.png',
    heroImage: '/posters/localization/blasphemous-georgian.png',
    name: 'Blasphemous — Georgian Localization',
    icon: 'Ⴕ',
    tag: 'TRANSLATION MOD',
    status: 'dev',
    shortDesc: 'An unofficial Georgian translation mod with a custom Gothic Georgian typeface and a complete static text corpus.',
    desc: `An unofficial, fan-made Georgian localization for Blasphemous. The project translates
    interface text, dialogue, items, quests, locations, achievements, DLC content, cutscenes, and
    system messages while preserving the game’s variables and formatting tokens. A custom Georgian
    font pipeline was built to keep the original Gothic atmosphere readable in Mkhedruli. All static
    text entries are translated; full-game visual QA and release packaging are still in progress.`,
    features: [
      '1,879 of 1,879 Static Localization Entries Translated',
      'Custom Gothic Georgian Mkhedruli Typeface',
      'Interface, Dialogue, Items, Quests, DLC, and Cutscenes',
      'Automated Key, Token, and Formatting Validation',
      'Runtime Loader and Localization-Specific UI Fixes',
      'Structured Full-Game Visual QA Matrix',
      'Release Packaging and Final Runtime Verification in Progress',
    ],
    techStack: ['Georgian Localization', '.NET', 'BepInEx', 'HarmonyX', 'Unity Asset Pipeline'],
    version: '0.1.0',
    progress: 'Static text complete · Visual QA in progress',
    disclaimer: 'Blasphemous is created by The Game Kitchen. This is an unofficial fan localization and is not affiliated with or endorsed by the game’s creators or publishers.',
  },
}

export function getLocalizations(status = null) {
  const all = Object.values(LOCALIZATIONS)
  return status ? all.filter(item => item.status === status) : all
}

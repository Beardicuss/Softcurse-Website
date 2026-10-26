-- Promote HexBrewers of Ashenveil 0.1.0 to a playable public web beta.

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.status', 'beta',
  '$.version', '0.1.0',
  '$.releaseDate', '2026-10-17',
  '$.ctaLabel', 'PLAY BETA',
  '$.ctaDisabled', json('false'),
  '$.platforms', json('["Web","Windows"]'),
  '$.shortDesc', 'Play the public beta: brew from a cursed bag, press your luck, and outscore the Shade before the ninth omen falls.'
), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-game-hexbrewers';

UPDATE releases
SET is_primary = 0, updated_at = CURRENT_TIMESTAMP
WHERE content_id = 'seed-game-hexbrewers' AND action_role = 'play';

INSERT OR REPLACE INTO releases (
  id, content_id, kind, action_role, provider, label, version, channel, platform,
  external_url, release_notes, status, is_primary, sort_order, download_count,
  created_by, created_at, updated_at, published_at
) VALUES (
  'release-hexbrewers-web-beta-0-1-0',
  'seed-game-hexbrewers',
  'web',
  'play',
  'custom',
  'PLAY BETA',
  '0.1.0',
  'beta',
  'web',
  'https://hexbrewers-of-ashenveil.cardinal-hex-mobile.workers.dev/',
  'Public web beta with the nine-round omen campaign, cursed-bag brewing, adaptive Shade opponent, Black Market upgrades, multilingual play, accessibility settings, persistent saves, and polished Pixi.js effects.',
  'published',
  1,
  0,
  0,
  'system-release',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

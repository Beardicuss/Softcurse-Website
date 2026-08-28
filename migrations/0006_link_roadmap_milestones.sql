-- Add automation links only where the milestone has one unambiguous source of truth.
-- Historical milestones and version-specific future releases remain manual.

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.items[0].syncMode', 'content',
  '$.items[0].linkedContentId', 'seed-app-medialab',
  '$.items[1].syncMode', 'content',
  '$.items[1].linkedContentId', 'seed-app-inkmind',
  '$.items[2].syncMode', 'content',
  '$.items[2].linkedContentId', 'seed-game-chronicles'
)
WHERE id = 'seed-roadmap-roadmap-3-q1-2025';

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.items[0].syncMode', 'content',
  '$.items[0].linkedContentId', 'seed-app-archvis',
  '$.items[1].syncMode', 'content',
  '$.items[1].linkedContentId', 'seed-app-spectral',
  '$.items[2].syncMode', 'content',
  '$.items[2].linkedContentId', 'seed-game-isle'
)
WHERE id = 'seed-roadmap-roadmap-4-q3-2025';

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.items[0].syncMode', 'content',
  '$.items[0].linkedContentId', 'seed-game-ww3'
)
WHERE id = 'seed-roadmap-roadmap-5-q1-2026';

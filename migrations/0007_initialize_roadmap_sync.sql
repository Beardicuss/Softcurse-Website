-- Initialize linked milestones from the project states present when automation was introduced.
-- Future changes are handled by the event-driven roadmap synchronizer.

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.items[0].status', 'in-progress',
  '$.items[1].status', 'in-progress',
  '$.items[2].status', 'planned'
)
WHERE id = 'seed-roadmap-roadmap-4-q3-2025';

UPDATE content_items
SET data_json = json_set(data_json, '$.items[0].status', 'in-progress')
WHERE id = 'seed-roadmap-roadmap-5-q1-2026';

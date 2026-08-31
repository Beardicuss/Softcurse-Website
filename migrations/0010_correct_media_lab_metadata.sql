-- Correct Media Lab's historical release date and position it as a media editor.
-- Generative AI is an optional integration, not the product category.

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.tag', 'MEDIA EDITOR',
  '$.releaseDate', '2025-07-12',
  '$.shortDesc', 'Hardware-accelerated media editor for image retouching, video cleanup, and audio/video conversion.',
  '$.desc', 'Softcurse Media Lab AI is a Windows 10/11 x64 media workspace for image editing, object and watermark removal, video retouching, and audio/video conversion. Its core editor, Toolkit Lab, local processing tools, and bundled FFmpeg workflow work without an external AI service. Optional generative features can connect to a trusted Stable Diffusion WebUI-compatible API when wanted.',
  '$.techStack', json('["WPF",".NET 8","ONNX Runtime","DirectML","OpenCV","FFmpeg"]')
), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-app-medialab';

INSERT INTO content_revisions (content_id, revision, action, data_json, created_by, created_at)
SELECT
  id,
  (SELECT COALESCE(MAX(revision), 0) + 1 FROM content_revisions WHERE content_id = content_items.id),
  'correct_product_metadata',
  data_json,
  'system-release',
  CURRENT_TIMESTAMP
FROM content_items
WHERE id = 'seed-app-medialab';

INSERT INTO audit_log (actor, action, entity_type, entity_id, metadata_json, created_at)
VALUES (
  'system-release',
  'correct_product_metadata',
  'content',
  'seed-app-medialab',
  '{"category":"MEDIA EDITOR","firstRelease":"2025-07-12","generativeAi":"optional"}',
  CURRENT_TIMESTAMP
);

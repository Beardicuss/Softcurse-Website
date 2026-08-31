-- Publish the externally hosted Softcurse Media Lab AI 1.0.0 installer.
-- The binary remains on GitHub Releases and consumes no Softcurse R2 storage.

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.status', 'active',
  '$.version', '1.0.0',
  '$.releaseDate', '2026 — Stable Release',
  '$.shortDesc', 'Local AI media editor for object removal, image tooling, video retouching, and audio/video conversion.',
  '$.desc', 'Softcurse Media Lab AI is a Windows 10/11 x64 media workspace for local image and video editing. Remove watermarks and unwanted objects with LaMa, create precise masks with brush, polygon, and Smart Select tools, remove backgrounds, edit layers and text, process video frame by frame, and convert audio or video with the bundled FFmpeg toolchain. Normal local features need no API; generative image features can optionally connect to a trusted Stable Diffusion WebUI-compatible API.',
  '$.features', json('["Local LaMa Object & Watermark Removal","Brush, Eraser, Polygon Lasso & Smart Select Masks","Background Removal, Filters, Gradients, Text & Layer Masks","Frame-by-Frame Video Retouch with Audio Remuxing","Batch Audio / Video Conversion with Bundled FFmpeg","Toolkit Lab — Resize, Convert, Crop, Compare & Metadata","Memory-Budgeted Undo / Redo & Startup Diagnostics","Optional Stable Diffusion-Compatible Generative Image API"]'),
  '$.techStack', json('["WPF",".NET 8","ONNX Runtime","DirectML","OpenCV","FFmpeg"]')
), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-app-medialab';

UPDATE releases
SET is_primary = 0, updated_at = CURRENT_TIMESTAMP
WHERE content_id = 'seed-app-medialab' AND action_role = 'download';

INSERT OR IGNORE INTO releases (
  id, content_id, kind, action_role, provider, label, version, channel, platform, architecture,
  external_url, file_name, mime_type, size_bytes, sha256, release_notes, status, is_primary,
  sort_order, download_count, created_by, created_at, updated_at, published_at
) VALUES (
  'release-medialab-v1-0-0',
  'seed-app-medialab',
  'external',
  'download',
  'github',
  'DOWNLOAD',
  '1.0.0',
  'stable',
  'windows',
  'x64',
  'https://github.com/Beardicuss/Softcurse-Media-Studio-AI/releases/download/v1.0.0/SoftcurseMediaLabAI_Setup_v1.0.0.exe',
  'SoftcurseMediaLabAI_Setup_v1.0.0.exe',
  'application/vnd.microsoft.portable-executable',
  330832686,
  '8bcf8a9d583f449abcc5075ab61e896f569bf5aad400b51fbce7a88fc6214c44',
  'Stable v1.0.0 for Windows 10/11 x64. Includes local LaMa removal, manual and Smart Select masks, image editing tools, frame-by-frame video retouching, bundled FFmpeg conversion, and optional Stable Diffusion-compatible generative features. No API is required for normal local features. This installer is not digitally signed, so Windows may display Unknown publisher or a SmartScreen warning; verify the SHA-256 checksum before installation.',
  'published',
  1,
  0,
  0,
  'system-release',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Keep both Media Lab roadmap entries consistent with the published stable release.
UPDATE content_items
SET data_json = json_set(data_json, '$.items[0].status', 'done'), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-roadmap-roadmap-3-q1-2025';

UPDATE content_items
SET data_json = json_set(data_json, '$.items[1].status', 'done'), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-roadmap-roadmap-5-q1-2026';

INSERT INTO content_revisions (content_id, revision, action, data_json, created_by, created_at)
SELECT
  id,
  (SELECT COALESCE(MAX(revision), 0) + 1 FROM content_revisions WHERE content_id = content_items.id),
  'publish_stable_release',
  data_json,
  'system-release',
  CURRENT_TIMESTAMP
FROM content_items
WHERE id IN ('seed-app-medialab', 'seed-roadmap-roadmap-3-q1-2025', 'seed-roadmap-roadmap-5-q1-2026');

INSERT INTO audit_log (actor, action, entity_type, entity_id, metadata_json, created_at)
VALUES (
  'system-release',
  'add_external_release',
  'release',
  'release-medialab-v1-0-0',
  '{"contentId":"seed-app-medialab","provider":"github","channel":"stable","tag":"v1.0.0"}',
  CURRENT_TIMESTAMP
);

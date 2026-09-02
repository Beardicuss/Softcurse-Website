-- Publish the externally hosted Blackwatch 0.1.0 early-alpha builds.
-- Both binaries remain on GitHub Releases and consume no Softcurse R2 storage.

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.tag', 'SECURITY MONITOR',
  '$.status', 'alpha',
  '$.version', '0.1.0-alpha',
  '$.releaseDate', '2026-09-02',
  '$.shortDesc', 'Local Windows process and network monitor with explainable heuristic evidence and guarded response controls.',
  '$.desc', 'Softcurse Blackwatch is an early-alpha monitoring application for Windows home users. It shows live system, process, and TCP connection activity, enriches process identities, and presents explainable heuristic evidence for review. Guarded response actions require native confirmation, with dry-run mode enabled by default. Blackwatch is not an antivirus and must be used alongside Microsoft Defender or another reputable security product.',
  '$.features', json('["Live CPU, Memory, Process & TCP Monitoring","Process Path, SHA-256, Publisher & Signature Details","Explainable Heuristic Process Scoring","Process and Network Evidence Correlation","3D Holographic Threat Sphere","Guarded Response with Dry-Run Mode by Default","Identity-Bound Trusted Applications","Privacy-Redacted Logs & Diagnostic ZIP Export"]'),
  '$.techStack', json('["React 19","TypeScript 5.9","WPF",".NET 10 LTS","WebView2","WMI"]')
), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-app-blackwatch';

UPDATE releases
SET is_primary = 0, updated_at = CURRENT_TIMESTAMP
WHERE content_id = 'seed-app-blackwatch' AND action_role = 'download';

INSERT OR IGNORE INTO releases (
  id, content_id, kind, action_role, provider, label, version, channel, platform, architecture,
  external_url, file_name, mime_type, size_bytes, sha256, release_notes, status, is_primary,
  sort_order, download_count, created_by, created_at, updated_at, published_at
) VALUES (
  'release-blackwatch-v0-1-0-alpha-installer', 'seed-app-blackwatch', 'external', 'download', 'github',
  'DOWNLOAD EARLY ALPHA', '0.1.0', 'alpha', 'windows', 'x64',
  'https://github.com/Beardicuss/SoftcurseBlackwatch/releases/download/v0.1.0-alpha/SoftcurseBlackwatchSetup.exe',
  'SoftcurseBlackwatchSetup.exe', 'application/vnd.microsoft.portable-executable', 58746443,
  '376dd5b5801ec5aa135c5f20e18098d8ba6d824018ec4b90b0dbe5919b72db08',
  'First public home-user preview. This early alpha provides local process and TCP monitoring, explainable heuristic evidence, and guarded response controls with dry-run enabled by default. It is not an antivirus and does not replace Microsoft Defender. The installer is unsigned, so Windows may display Unknown publisher or a SmartScreen warning; verify the SHA-256 checksum before installation.',
  'published', 1, 0, 0, 'system-release', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO releases (
  id, content_id, kind, action_role, provider, label, version, channel, platform, architecture,
  external_url, file_name, mime_type, size_bytes, sha256, release_notes, status, is_primary,
  sort_order, download_count, created_by, created_at, updated_at, published_at
) VALUES (
  'release-blackwatch-v0-1-0-alpha-portable', 'seed-app-blackwatch', 'external', 'download', 'github',
  'DOWNLOAD PORTABLE', '0.1.0', 'alpha', 'windows', 'x64',
  'https://github.com/Beardicuss/SoftcurseBlackwatch/releases/download/v0.1.0-alpha/SoftcurseBlackwatch-0.1.0-alpha-win-x64.zip',
  'SoftcurseBlackwatch-0.1.0-alpha-win-x64.zip', 'application/zip', 81534613,
  '25f967a51e1b1e1731277c16976998e5a143631d5a070ed625aca6299824c5c3',
  'Portable Windows x64 build containing the same self-contained early-alpha application without the installer. Keep Microsoft Defender enabled and leave Dry-Run Mode enabled while evaluating detections.',
  'published', 0, 1, 0, 'system-release', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Remove two inaccurate historical Blackwatch release claims.
UPDATE content_items
SET data_json = json_remove(data_json, '$.items[0]'), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-roadmap-roadmap-1-q1-2024';

UPDATE content_items
SET data_json = json_remove(data_json, '$.items[2]'), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-roadmap-roadmap-2-q3-2024';

UPDATE content_items SET sort_order = sort_order + 1
WHERE type = 'roadmap' AND sort_order >= 32;

INSERT OR IGNORE INTO content_items (
  id, type, slug, title, status, sort_order, data_json, created_at, updated_at, published_at
) VALUES (
  'seed-roadmap-roadmap-q3-2026', 'roadmap', 'roadmap-q3-2026', 'Q3 2026', 'published', 32,
  '{"quarter":"Q3 2026","items":[{"id":"blackwatch-early-alpha","title":"Blackwatch — Early Alpha","type":"LAB","status":"in-progress","desc":"First public home-user preview with local process and network monitoring, explainable heuristic evidence, and guarded response controls.","syncMode":"content","linkedContentId":"seed-app-blackwatch"}]}',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

INSERT INTO content_revisions (content_id, revision, action, data_json, created_by, created_at)
SELECT id,
  (SELECT COALESCE(MAX(revision), 0) + 1 FROM content_revisions WHERE content_id = content_items.id),
  'publish_early_alpha_release', data_json, 'system-release', CURRENT_TIMESTAMP
FROM content_items
WHERE id IN ('seed-app-blackwatch', 'seed-roadmap-roadmap-1-q1-2024',
  'seed-roadmap-roadmap-2-q3-2024', 'seed-roadmap-roadmap-q3-2026');

INSERT INTO audit_log (actor, action, entity_type, entity_id, metadata_json, created_at)
VALUES ('system-release', 'add_external_release', 'release',
  'release-blackwatch-v0-1-0-alpha-installer',
  '{"contentId":"seed-app-blackwatch","provider":"github","channel":"alpha","tag":"v0.1.0-alpha"}',
  CURRENT_TIMESTAMP);

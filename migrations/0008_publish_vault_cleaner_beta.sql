-- Publish the externally hosted Vault Cleaner 1.0.0 beta installer.
-- The binary remains on GitHub Releases and consumes no Softcurse R2 storage.

UPDATE content_items
SET data_json = json_set(
  data_json,
  '$.status', 'beta',
  '$.version', '1.0.0',
  '$.releaseDate', '2026 — Public Beta',
  '$.shortDesc', 'Safe Windows cleanup and disk analysis with exact previews, protected-path validation, and recoverable deletion.',
  '$.desc', 'Softcurse Vault Cleaner is a Windows 10/11 cleanup and disk-analysis utility designed around deliberate, reviewable operations. Preview exact targets before cleanup, reject protected paths and unsafe roots, send supported filesystem cleanup to the Recycle Bin, inspect drives or folders for storage usage, and discover duplicate or unusually large files. The application runs normally as a standard user and requests UAC only for optional Windows component maintenance.',
  '$.features', json('["Exact Cleanup Target Preview","Protected-Path, Root, Junction & Mount-Point Validation","Recoverable Filesystem Cleanup via Recycle Bin","Browser, Temporary, Developer & Graphics Cache Cleanup","Drive and Folder Disk Analysis","Duplicate and Large-File Discovery","HTML Storage Reports","Optional Elevated DISM Component Maintenance"]'),
  '$.techStack', json('["WPF",".NET 10","C#","MVVM","WebView2"]')
), updated_at = CURRENT_TIMESTAMP
WHERE id = 'seed-app-vault';

UPDATE releases
SET is_primary = 0, updated_at = CURRENT_TIMESTAMP
WHERE content_id = 'seed-app-vault' AND action_role = 'download';

INSERT OR IGNORE INTO releases (
  id, content_id, kind, action_role, provider, label, version, channel, platform, architecture,
  external_url, file_name, mime_type, size_bytes, sha256, release_notes, status, is_primary,
  sort_order, download_count, created_by, created_at, updated_at, published_at
) VALUES (
  'release-vault-v1-0-0-beta',
  'seed-app-vault',
  'external',
  'download',
  'github',
  'DOWNLOAD BETA',
  '1.0.0',
  'beta',
  'windows',
  'x64',
  'https://github.com/Beardicuss/SOFTCURSE-VAULT-ENGINE/releases/download/v1.0.0-beta/SoftcurseVaultCleaner_Setup_v1.0.0.exe',
  'SoftcurseVaultCleaner_Setup_v1.0.0.exe',
  'application/vnd.microsoft.portable-executable',
  73729469,
  '58e3c5bdc1fc7a1f084eb5288fdd5334a0a1d1a52b2cc67de936485c5f049135',
  'Public beta for Windows 10/11 x64. Includes safe cleanup previews, recoverable filesystem cleanup, protected-path validation, disk analysis, duplicate and large-file discovery, and optional elevated Windows component maintenance. This beta is not digitally signed, so Windows may display Unknown publisher or a SmartScreen warning. Automatic updates remain disabled until production code signing is configured.',
  'published',
  1,
  0,
  0,
  'system-release',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO content_revisions (content_id, revision, action, data_json, created_by, created_at)
SELECT
  id,
  (SELECT COALESCE(MAX(revision), 0) + 1 FROM content_revisions WHERE content_id = content_items.id),
  'publish_beta_release',
  data_json,
  'system-release',
  CURRENT_TIMESTAMP
FROM content_items
WHERE id = 'seed-app-vault';

INSERT INTO audit_log (actor, action, entity_type, entity_id, metadata_json, created_at)
VALUES (
  'system-release',
  'add_external_release',
  'release',
  'release-vault-v1-0-0-beta',
  '{"contentId":"seed-app-vault","provider":"github","channel":"beta","tag":"v1.0.0-beta"}',
  CURRENT_TIMESTAMP
);

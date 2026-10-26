-- Refresh the Vault Cleaner 1.0.0 beta artifact after the October 2026 rebuild.
-- The public GitHub download URL is stable because the release asset was replaced in place.

UPDATE releases
SET
  size_bytes = 73774211,
  sha256 = '60673c5a9c37227059de0d5ad5fbad75e2030bf29ed112e6f81fbde622301f43',
  release_notes = 'Updated public beta for Windows 10/11 x64. Includes safe cleanup previews, recoverable filesystem cleanup, protected-path validation, disk analysis, duplicate and large-file discovery, and optional elevated Windows component maintenance. This beta is not digitally signed, so Windows may display Unknown publisher or a SmartScreen warning. Verify the published SHA-256 checksum before running it.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'release-vault-v1-0-0-beta';

INSERT INTO audit_log (actor, action, entity_type, entity_id, metadata_json, created_at)
VALUES (
  'system-release',
  'replace_external_release_asset',
  'release',
  'release-vault-v1-0-0-beta',
  '{"contentId":"seed-app-vault","provider":"github","channel":"beta","tag":"v1.0.0-beta","build":"70548cb","sha256":"60673c5a9c37227059de0d5ad5fbad75e2030bf29ed112e6f81fbde622301f43"}',
  CURRENT_TIMESTAMP
);

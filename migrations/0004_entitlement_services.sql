ALTER TABLE orders ADD COLUMN refunded_minor INTEGER NOT NULL DEFAULT 0 CHECK (refunded_minor >= 0);
ALTER TABLE entitlements ADD COLUMN source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'purchase', 'promotion', 'support'));
ALTER TABLE entitlements ADD COLUMN provider_entitlement_id TEXT;
ALTER TABLE entitlements ADD COLUMN note TEXT;
ALTER TABLE licenses ADD COLUMN activation_count INTEGER NOT NULL DEFAULT 0 CHECK (activation_count >= 0);
ALTER TABLE payment_events ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count > 0);
ALTER TABLE download_tokens ADD COLUMN revoked_at TEXT;

CREATE UNIQUE INDEX idx_entitlements_provider_reference
  ON entitlements(provider_entitlement_id) WHERE provider_entitlement_id IS NOT NULL;
CREATE INDEX idx_entitlements_content ON entitlements(content_id, status, granted_at DESC);
CREATE INDEX idx_licenses_entitlement ON licenses(entitlement_id, status);

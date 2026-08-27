PRAGMA foreign_keys = OFF;

CREATE TABLE releases_v2 (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('web', 'file', 'external')),
  action_role TEXT NOT NULL DEFAULT 'download' CHECK (action_role IN ('play', 'download', 'store', 'source')),
  provider TEXT NOT NULL DEFAULT 'softcurse' CHECK (provider IN ('softcurse', 'github', 'mega', 'itchio', 'google_drive', 'onedrive', 'dropbox', 'custom')),
  label TEXT NOT NULL,
  version TEXT,
  channel TEXT NOT NULL DEFAULT 'stable' CHECK (channel IN ('stable', 'beta', 'alpha', 'dev')),
  platform TEXT NOT NULL,
  architecture TEXT,
  external_url TEXT,
  r2_key TEXT,
  file_name TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  sha256 TEXT,
  release_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  CHECK (
    (kind = 'web' AND external_url IS NOT NULL AND r2_key IS NULL) OR
    (kind = 'external' AND external_url IS NOT NULL AND r2_key IS NULL) OR
    (kind = 'file' AND r2_key IS NOT NULL AND external_url IS NULL)
  )
);

INSERT INTO releases_v2 (
  id, content_id, kind, action_role, provider, label, version, channel, platform, architecture,
  external_url, r2_key, file_name, mime_type, size_bytes, sha256, release_notes, status,
  is_primary, sort_order, download_count, created_by, created_at, updated_at, published_at
)
SELECT
  id, content_id, kind,
  CASE WHEN kind = 'web' THEN 'play' ELSE 'download' END,
  CASE WHEN kind = 'file' THEN 'softcurse' ELSE 'custom' END,
  label, version, 'stable', platform, architecture, external_url, r2_key, file_name, mime_type,
  size_bytes, sha256, release_notes, status, is_primary, sort_order, download_count, created_by,
  created_at, updated_at, published_at
FROM releases;

DROP TABLE releases;
ALTER TABLE releases_v2 RENAME TO releases;

CREATE INDEX idx_releases_content_status
  ON releases(content_id, status, action_role, is_primary DESC, sort_order);
CREATE INDEX idx_releases_provider ON releases(provider, status);
CREATE UNIQUE INDEX idx_releases_primary_action
  ON releases(content_id, action_role) WHERE is_primary = 1;

CREATE TABLE commerce_products (
  content_id TEXT PRIMARY KEY,
  sale_mode TEXT NOT NULL DEFAULT 'free' CHECK (sale_mode IN ('free', 'paid', 'external_store', 'coming_soon')),
  storefront_status TEXT NOT NULL DEFAULT 'disabled' CHECK (storefront_status IN ('disabled', 'preview', 'live')),
  price_minor INTEGER CHECK (price_minor IS NULL OR price_minor >= 0),
  compare_at_price_minor INTEGER CHECK (compare_at_price_minor IS NULL OR compare_at_price_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  checkout_provider TEXT CHECK (checkout_provider IS NULL OR checkout_provider IN ('stripe', 'lemon_squeezy', 'itchio', 'gumroad', 'custom')),
  checkout_reference TEXT,
  external_store_url TEXT,
  requires_entitlement INTEGER NOT NULL DEFAULT 0 CHECK (requires_entitlement IN (0, 1)),
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  CHECK (storefront_status != 'live' OR sale_mode != 'paid' OR (price_minor IS NOT NULL AND checkout_provider IS NOT NULL))
);

INSERT OR IGNORE INTO commerce_products (content_id, updated_by)
SELECT id, 'system' FROM content_items WHERE type IN ('game', 'app', 'experiment', 'localization');

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL UNIQUE,
  provider_customer_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  provider TEXT NOT NULL,
  provider_order_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'refunded', 'partially_refunded', 'disputed', 'canceled')),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  UNIQUE (provider, provider_order_id)
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE RESTRICT
);

CREATE TABLE entitlements (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  order_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'refunded', 'expired')),
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  UNIQUE (customer_id, content_id)
);

CREATE TABLE licenses (
  id TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL,
  license_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  activation_limit INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  FOREIGN KEY (entitlement_id) REFERENCES entitlements(id) ON DELETE CASCADE
);

CREATE TABLE payment_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  payload_sha256 TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  error_message TEXT,
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE download_tokens (
  token_hash TEXT PRIMARY KEY,
  entitlement_id TEXT NOT NULL,
  release_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entitlement_id) REFERENCES entitlements(id) ON DELETE CASCADE,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX idx_entitlements_customer ON entitlements(customer_id, status);
CREATE INDEX idx_payment_events_status ON payment_events(status, received_at);
CREATE INDEX idx_download_tokens_expiry ON download_tokens(expires_at);

PRAGMA foreign_keys = ON;

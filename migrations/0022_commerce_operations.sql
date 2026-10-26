PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS commerce_inventory (
  content_id TEXT PRIMARY KEY,
  tracking_enabled INTEGER NOT NULL DEFAULT 0 CHECK (tracking_enabled IN (0, 1)),
  quantity INTEGER CHECK (quantity IS NULL OR quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO commerce_inventory (content_id, updated_by)
SELECT content_id, 'system' FROM commerce_products;

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  currency TEXT CHECK (currency IS NULL OR length(currency) = 3),
  max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  redemption_count INTEGER NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),
  starts_at TEXT,
  expires_at TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  provider_refund_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'void')),
  issued_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_enabled ON coupons(enabled, expires_at);

INSERT OR IGNORE INTO permissions (key, group_name, description) VALUES
  ('orders.view', 'Commerce', 'View orders, customers, refunds, and invoices.'),
  ('orders.manage', 'Commerce', 'Manage sandbox orders, coupons, refunds, and invoices.');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT 'role-super-admin', key FROM permissions WHERE key IN ('orders.view', 'orders.manage');
INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES
  ('role-admin', 'orders.view'), ('role-admin', 'orders.manage'), ('role-viewer', 'orders.view');

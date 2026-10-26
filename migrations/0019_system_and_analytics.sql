PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS page_analytics_daily (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'direct',
  device TEXT NOT NULL DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet', 'bot')),
  country TEXT NOT NULL DEFAULT 'XX',
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  PRIMARY KEY (day, path, source, device, country)
);

CREATE INDEX IF NOT EXISTS idx_page_analytics_day ON page_analytics_daily(day DESC);

CREATE TABLE IF NOT EXISTS system_backups (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'database' CHECK (kind IN ('database')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  size_bytes INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_events (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_events_created ON system_events(created_at DESC);

CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO system_state (key, value, updated_by) VALUES ('cache_epoch', '1', 'system');
INSERT OR IGNORE INTO system_events (id, level, source, message) VALUES ('system-analytics-enabled', 'info', 'system', 'Privacy-safe first-party analytics enabled.');

INSERT OR IGNORE INTO permissions (key, group_name, description)
VALUES ('analytics.view', 'Analytics', 'View first-party traffic and operational reports.');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT 'role-super-admin', key FROM permissions WHERE key = 'analytics.view';
INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES
  ('role-admin', 'analytics.view'), ('role-viewer', 'analytics.view');

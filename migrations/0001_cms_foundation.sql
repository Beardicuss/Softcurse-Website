PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('game', 'app', 'experiment', 'localization', 'chronicle', 'blog', 'roadmap')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  UNIQUE (type, slug)
);

CREATE INDEX IF NOT EXISTS idx_content_type_status_order
  ON content_items(type, status, sort_order, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_updated
  ON content_items(updated_at DESC);

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  action TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  UNIQUE (content_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_revisions_content
  ON content_revisions(content_id, revision DESC);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  slot TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  UNIQUE (content_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_assets_content ON assets(content_id);

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('web', 'file')),
  label TEXT NOT NULL,
  version TEXT,
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
    (kind = 'file' AND r2_key IS NOT NULL AND external_url IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_releases_content_status
  ON releases(content_id, status, is_primary DESC, sort_order);

CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  r2_upload_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  part_size INTEGER NOT NULL,
  release_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'aborted')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_expiry
  ON upload_sessions(status, expires_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash TEXT NOT NULL,
  success INTEGER NOT NULL CHECK (success IN (0, 1)),
  attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
  ON login_attempts(ip_hash, attempted_at DESC);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

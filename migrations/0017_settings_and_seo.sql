PRAGMA foreign_keys = ON;

CREATE TABLE settings_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_revisions_key ON settings_revisions(setting_key, created_at DESC);

CREATE TABLE seo_redirects (
  id TEXT PRIMARY KEY,
  source_path TEXT NOT NULL UNIQUE,
  destination TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seo_redirects_active_source ON seo_redirects(is_active, source_path);

INSERT OR IGNORE INTO settings (key, value_json, updated_by) VALUES
  ('site', '{"name":"Softcurse Systems","tagline":"Focused software, experimental technology, games, and stories.","description":"Softcurse Systems creates focused Windows software, experimental technology, browser games, and dark speculative fiction.","contactEmail":"","themeColor":"#4ffff0","logoUrl":"/logo.webp","faviconUrl":"/favicon.ico","socials":{"github":"https://github.com/Beardicuss","youtube":"","discord":"","x":""}}', 'system'),
  ('seo', '{"titleTemplate":"%s — Softcurse Systems","defaultTitle":"Softcurse Systems","defaultDescription":"Focused Windows software, experimental tools, browser games, and dark speculative fiction—built with purpose.","defaultOgImage":"/og-image.png","robotsIndex":true,"sitemapEnabled":true,"excludedPaths":[]}', 'system'),
  ('maintenance', '{"enabled":false,"title":"Maintenance in progress","message":"Softcurse Systems is temporarily unavailable while an update is being completed.","allowAdmins":true}', 'system');

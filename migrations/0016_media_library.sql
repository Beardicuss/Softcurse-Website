PRAGMA foreign_keys = ON;

CREATE TABLE media_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE,
  parent_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES media_folders(id) ON DELETE RESTRICT,
  UNIQUE (parent_id, name)
);

CREATE TABLE media_items (
  id TEXT PRIMARY KEY,
  folder_id TEXT,
  r2_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  sha256 TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES media_folders(id) ON DELETE SET NULL
);

CREATE INDEX idx_media_items_folder_updated ON media_items(folder_id, updated_at DESC);
CREATE INDEX idx_media_items_type_updated ON media_items(mime_type, updated_at DESC);

CREATE TABLE media_usage (
  media_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  usage_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (media_id, content_id, usage_key),
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_media_usage_content ON media_usage(content_id, usage_key);

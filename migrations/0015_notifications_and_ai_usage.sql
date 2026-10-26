PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'security')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_hash TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_user
  ON admin_notifications(user_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  model TEXT NOT NULL,
  input_chars INTEGER NOT NULL CHECK (input_chars >= 0),
  output_chars INTEGER NOT NULL DEFAULT 0 CHECK (output_chars >= 0),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_ai_usage_daily
  ON admin_ai_usage(user_id, created_at DESC);

INSERT INTO admin_notifications (id, type, title, message)
VALUES ('notification-ai-foundation', 'info', 'AI assistant available', 'Workers AI assistance is ready with a strict daily safety limit. Suggestions always require manual review.');


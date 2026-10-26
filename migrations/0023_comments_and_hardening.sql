PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS blog_comments (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  parent_id TEXT,
  author_name TEXT NOT NULL,
  email_hash TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  ip_hash TEXT,
  user_agent TEXT,
  moderated_by TEXT,
  moderated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES blog_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (moderated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_content_status ON blog_comments(content_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status_created ON blog_comments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comments_ip_created ON blog_comments(ip_hash, created_at DESC);

INSERT OR IGNORE INTO permissions (key, group_name, description) VALUES
  ('comments.view', 'Moderation', 'View blog comments and moderation history.'),
  ('comments.manage', 'Moderation', 'Approve, reject, flag spam, reply to, and delete blog comments.');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT 'role-super-admin', key FROM permissions WHERE key IN ('comments.view', 'comments.manage');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES
  ('role-admin', 'comments.view'), ('role-admin', 'comments.manage'),
  ('role-moderator', 'comments.view'), ('role-moderator', 'comments.manage'),
  ('role-editor', 'comments.view'), ('role-viewer', 'comments.view');

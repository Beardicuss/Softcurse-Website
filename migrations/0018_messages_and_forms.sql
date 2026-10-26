PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS form_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  description TEXT NOT NULL DEFAULT '',
  schema_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO form_definitions (id, name, slug, description, schema_json)
VALUES ('form-contact', 'Website contact form', 'contact', 'Messages sent from the public contact page.', '{"fields":["name","email","subject","message"],"turnstile":true}');

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL DEFAULT 'form-contact',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived', 'spam')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  delivery_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  admin_notes TEXT NOT NULL DEFAULT '',
  assigned_to TEXT,
  replied_at TEXT,
  replied_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES form_definitions(id),
  FOREIGN KEY (assigned_to) REFERENCES admin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (replied_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created ON contact_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_ip_created ON contact_messages(ip_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_message_events (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES contact_messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contact_message_events_message ON contact_message_events(message_id, created_at DESC);

INSERT OR IGNORE INTO permissions (key, group_name, description) VALUES
  ('messages.view', 'Messages', 'View contact form messages and moderation history.'),
  ('messages.manage', 'Messages', 'Reply to, annotate, and moderate contact form messages.');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT 'role-super-admin', key FROM permissions WHERE key IN ('messages.view', 'messages.manage');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES
  ('role-admin', 'messages.view'), ('role-admin', 'messages.manage'),
  ('role-moderator', 'messages.view'), ('role-moderator', 'messages.manage'),
  ('role-viewer', 'messages.view');

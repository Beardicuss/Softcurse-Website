PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'disabled')),
  locale TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_system INTEGER NOT NULL DEFAULT 1 CHECK (is_system IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  key TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  assigned_by TEXT,
  assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_key),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_key) REFERENCES permissions(key) ON DELETE CASCADE
);

ALTER TABLE admin_sessions ADD COLUMN admin_user_id TEXT REFERENCES admin_users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id, expires_at DESC);

INSERT OR IGNORE INTO roles (id, name, description) VALUES
  ('role-super-admin', 'Super Admin', 'Unrestricted control of the website and administration system.'),
  ('role-admin', 'Admin', 'Manage the site while protected ownership and security controls remain restricted.'),
  ('role-editor', 'Editor', 'Create, edit, schedule, and publish content and media.'),
  ('role-moderator', 'Moderator', 'Moderate comments, messages, and community accounts.'),
  ('role-viewer', 'Viewer', 'Read-only access to dashboards and reports.');

INSERT OR IGNORE INTO permissions (key, group_name, description) VALUES
  ('dashboard.view', 'Dashboard', 'View dashboard metrics and activity.'),
  ('content.view', 'Content', 'View content records.'),
  ('content.create', 'Content', 'Create content records.'),
  ('content.update', 'Content', 'Edit content records.'),
  ('content.publish', 'Content', 'Publish or archive content.'),
  ('media.view', 'Media', 'View media and files.'),
  ('media.manage', 'Media', 'Upload, replace, and remove media.'),
  ('releases.view', 'Releases', 'View releases and delivery configuration.'),
  ('releases.manage', 'Releases', 'Manage releases and downloadable files.'),
  ('commerce.view', 'Commerce', 'View commerce and entitlement data.'),
  ('commerce.manage', 'Commerce', 'Modify commerce and entitlement data.'),
  ('users.view', 'Users', 'View administrator accounts and roles.'),
  ('users.manage', 'Users', 'Create, edit, suspend, and assign administrator roles.'),
  ('settings.view', 'Settings', 'View site settings.'),
  ('settings.manage', 'Settings', 'Modify site settings.'),
  ('security.view', 'Security', 'View sessions, login history, and audit events.'),
  ('security.manage', 'Security', 'Manage security policy, sessions, and access rules.'),
  ('ai.use', 'AI', 'Use approved AI-assisted authoring tools.'),
  ('system.manage', 'System', 'Manage backups, tasks, logs, and system operations.');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT 'role-super-admin', key FROM permissions;

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT 'role-admin', key FROM permissions
WHERE key NOT IN ('users.manage', 'security.manage', 'system.manage');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES
  ('role-editor', 'dashboard.view'), ('role-editor', 'content.view'),
  ('role-editor', 'content.create'), ('role-editor', 'content.update'),
  ('role-editor', 'content.publish'), ('role-editor', 'media.view'),
  ('role-editor', 'media.manage'), ('role-editor', 'releases.view'),
  ('role-editor', 'releases.manage'), ('role-editor', 'ai.use'),
  ('role-moderator', 'dashboard.view'), ('role-moderator', 'content.view'),
  ('role-viewer', 'dashboard.view'), ('role-viewer', 'content.view'),
  ('role-viewer', 'media.view'), ('role-viewer', 'releases.view'),
  ('role-viewer', 'commerce.view'), ('role-viewer', 'users.view'),
  ('role-viewer', 'settings.view'), ('role-viewer', 'security.view');


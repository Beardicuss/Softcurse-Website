PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO settings (key, value_json, updated_by) VALUES
('layout', '{"announcement":{"enabled":false,"text":"","link":"","label":"LEARN MORE"},"navigation":[{"id":"home","label":"HOME","path":"/","enabled":true},{"id":"lab","label":"LAB","enabled":true,"children":[{"label":"Overview","path":"/lab"},{"label":"Apps & Tools","path":"/lab/apps"},{"label":"Experiments","path":"/experiments"},{"label":"Localization","path":"/localization"}]},{"id":"studio","label":"STUDIO","enabled":true,"children":[{"label":"Overview","path":"/studio"},{"label":"Games","path":"/studio/games"}]},{"id":"chronicles","label":"CHRONICLES","path":"/chronicles","enabled":true},{"id":"blog","label":"BLOG","path":"/blog","enabled":true},{"id":"about","label":"ABOUT","path":"/about","enabled":true},{"id":"info","label":"INFO","enabled":true,"children":[{"label":"Contact","path":"/contact"},{"label":"Roadmap","path":"/roadmap"},{"label":"Press Kit","path":"/press"}]}],"footer":[{"id":"lab","title":"LAB","links":[{"label":"Overview","path":"/lab"},{"label":"Apps & Tools","path":"/lab/apps"},{"label":"Experiments","path":"/experiments"}]},{"id":"studio","title":"STUDIO","links":[{"label":"Overview","path":"/studio"},{"label":"Games","path":"/studio/games"},{"label":"Chronicles","path":"/chronicles"}]},{"id":"navigate","title":"NAVIGATE","links":[{"label":"About","path":"/about"},{"label":"Contact","path":"/contact"},{"label":"Blog","path":"/blog"},{"label":"Localization","path":"/localization"},{"label":"Roadmap","path":"/roadmap"},{"label":"Press Kit","path":"/press"}]}],"homeSections":[{"id":"hero","label":"Hero","enabled":true},{"id":"stats","label":"Statistics","enabled":true},{"id":"lab","label":"Lab preview","enabled":true},{"id":"studio","label":"Studio preview","enabled":true},{"id":"newsletter","label":"Newsletter","enabled":true},{"id":"cta","label":"Call to action","enabled":true}]}', 'system');

INSERT OR IGNORE INTO settings (key, value_json, updated_by)
SELECT 'layout_draft', value_json, 'system' FROM settings WHERE key = 'layout';

INSERT OR IGNORE INTO permissions (key, group_name, description) VALUES
  ('layout.view', 'Layout', 'View navigation and layout configuration.'),
  ('layout.manage', 'Layout', 'Edit and publish navigation and layout configuration.');

INSERT OR IGNORE INTO role_permissions (role_id, permission_key)
SELECT 'role-super-admin', key FROM permissions WHERE key IN ('layout.view', 'layout.manage');
INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES
  ('role-admin', 'layout.view'), ('role-admin', 'layout.manage'),
  ('role-editor', 'layout.view'), ('role-editor', 'layout.manage'),
  ('role-viewer', 'layout.view');

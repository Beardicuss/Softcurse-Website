import { json } from '../../../_lib/cms.js'

export async function onRequestGet(context) {
  const [roles, permissions] = await context.env.CMS_DB.batch([
    context.env.CMS_DB.prepare(`SELECT r.id, r.name, r.description, r.is_system,
      (SELECT COUNT(*) FROM admin_user_roles ur WHERE ur.role_id = r.id) AS user_count,
      COALESCE((SELECT json_group_array(rp.permission_key) FROM role_permissions rp WHERE rp.role_id = r.id), '[]') AS permissions_json
      FROM roles r ORDER BY CASE r.id WHEN 'role-super-admin' THEN 0 WHEN 'role-admin' THEN 1 WHEN 'role-editor' THEN 2 WHEN 'role-moderator' THEN 3 ELSE 4 END`),
    context.env.CMS_DB.prepare('SELECT key, group_name, description FROM permissions ORDER BY group_name, key'),
  ])
  return json({ ok: true, roles: roles.results.map(row => ({ id: row.id, name: row.name, description: row.description, isSystem: Boolean(row.is_system), userCount: Number(row.user_count), permissions: JSON.parse(row.permissions_json) })), permissions: permissions.results })
}

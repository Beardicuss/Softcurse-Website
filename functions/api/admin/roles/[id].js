import { apiError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

export async function onRequestPatch(context) {
  try {
    const roleId = context.params.id
    if (roleId === 'role-super-admin') return apiError(400, 'The Super Admin permission set cannot be reduced.', 'PROTECTED_ROLE')
    const role = await context.env.CMS_DB.prepare('SELECT id, name FROM roles WHERE id = ?1').bind(roleId).first()
    if (!role) return apiError(404, 'Role not found.', 'ROLE_NOT_FOUND')
    const body = await readJson(context.request, 32768)
    const keys = [...new Set((Array.isArray(body.permissions) ? body.permissions : []).map(String))]
    const valid = await context.env.CMS_DB.prepare(`SELECT key FROM permissions WHERE key IN (${keys.map((_, index) => `?${index + 1}`).join(',') || "''"})`).bind(...keys).all()
    if (valid.results.length !== keys.length) return apiError(400, 'One or more permission keys are invalid.', 'INVALID_PERMISSION')
    const statements = [context.env.CMS_DB.prepare('DELETE FROM role_permissions WHERE role_id = ?1').bind(roleId)]
    for (const key of keys) statements.push(context.env.CMS_DB.prepare('INSERT INTO role_permissions (role_id, permission_key) VALUES (?1, ?2)').bind(roleId, key))
    await context.env.CMS_DB.batch(statements)
    await writeAudit(context.env, context.data.admin.username, 'update_permissions', 'role', roleId, { role: role.name, permissions: keys })
    return json({ ok: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}


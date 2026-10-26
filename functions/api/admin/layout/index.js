import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

function validPath(value) { return typeof value === 'string' && (value.startsWith('/') || value.startsWith('https://')) && value.length <= 500 }
function validate(layout) {
  if (!layout || !Array.isArray(layout.navigation) || !Array.isArray(layout.footer) || !Array.isArray(layout.homeSections)) throw new CmsError(400, 'Layout structure is incomplete.', 'INVALID_LAYOUT')
  for (const item of layout.navigation) {
    if (!String(item.label || '').trim() || (!item.path && !Array.isArray(item.children))) throw new CmsError(400, 'Every navigation item needs a label and destination.', 'INVALID_NAV_ITEM')
    if (item.path && !validPath(item.path)) throw new CmsError(400, 'Navigation destinations must be site paths or HTTPS URLs.', 'INVALID_NAV_PATH')
    for (const child of item.children || []) if (!child.label || !validPath(child.path)) throw new CmsError(400, 'Dropdown links need a label and valid destination.', 'INVALID_NAV_CHILD')
  }
  if (layout.navigation.length > 12 || layout.footer.length > 6 || layout.homeSections.length > 12) throw new CmsError(400, 'Layout contains too many items.', 'LAYOUT_LIMIT')
  return layout
}

export async function onRequestGet(context) {
  try {
    const [rows, revisions] = await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare("SELECT key, value_json, updated_at, updated_by FROM settings WHERE key IN ('layout', 'layout_draft')"),
      context.env.CMS_DB.prepare("SELECT id, value_json, changed_by, created_at FROM settings_revisions WHERE setting_key = 'layout' ORDER BY id DESC LIMIT 15"),
    ])
    const values = Object.fromEntries(rows.results.map(row => [row.key, { value: JSON.parse(row.value_json), updatedAt: row.updated_at, updatedBy: row.updated_by }]))
    return json({ ok: true, published: values.layout, draft: values.layout_draft || values.layout, revisions: revisions.results })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPatch(context) {
  try {
    const layout = validate((await readJson(context.request, 131_072)).layout)
    await context.env.CMS_DB.prepare("INSERT INTO settings (key, value_json, updated_by, updated_at) VALUES ('layout_draft', ?1, ?2, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP").bind(JSON.stringify(layout), context.data.admin.username).run()
    await writeAudit(context.env, context.data.admin.username, 'save_layout_draft', 'layout')
    return json({ ok: true, layout })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request, 4096)
    if (body.action === 'publish') {
      const draft = await context.env.CMS_DB.prepare("SELECT value_json FROM settings WHERE key = 'layout_draft'").first()
      if (!draft) throw new CmsError(404, 'No layout draft exists.', 'LAYOUT_DRAFT_MISSING')
      validate(JSON.parse(draft.value_json))
      await context.env.CMS_DB.batch([
        context.env.CMS_DB.prepare("INSERT INTO settings_revisions (setting_key, value_json, changed_by) SELECT 'layout', value_json, ?1 FROM settings WHERE key = 'layout'").bind(context.data.admin.username),
        context.env.CMS_DB.prepare("UPDATE settings SET value_json = ?1, updated_by = ?2, updated_at = CURRENT_TIMESTAMP WHERE key = 'layout'").bind(draft.value_json, context.data.admin.username),
      ])
      await writeAudit(context.env, context.data.admin.username, 'publish_layout', 'layout')
      return json({ ok: true })
    }
    if (body.action === 'restore') {
      const revision = await context.env.CMS_DB.prepare("SELECT value_json FROM settings_revisions WHERE id = ?1 AND setting_key = 'layout'").bind(Number(body.revisionId)).first()
      if (!revision) throw new CmsError(404, 'Layout revision not found.', 'LAYOUT_REVISION_NOT_FOUND')
      await context.env.CMS_DB.prepare("UPDATE settings SET value_json = ?1, updated_by = ?2, updated_at = CURRENT_TIMESTAMP WHERE key = 'layout_draft'").bind(revision.value_json, context.data.admin.username).run()
      await writeAudit(context.env, context.data.admin.username, 'restore_layout_draft', 'layout', String(body.revisionId))
      return json({ ok: true })
    }
    throw new CmsError(400, 'Unknown layout action.', 'INVALID_LAYOUT_ACTION')
  } catch (error) { return handleCmsError(error, context.request) }
}

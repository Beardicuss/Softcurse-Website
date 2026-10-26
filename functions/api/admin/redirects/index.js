import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

function validatePath(value) {
  const path = String(value || '').trim().slice(0, 500)
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#')) throw new CmsError(400, 'Source must be a path beginning with one slash, without a query or fragment.', 'INVALID_REDIRECT_SOURCE')
  if (path.startsWith('/api/') || path === '/admin' || path.startsWith('/admin/')) throw new CmsError(400, 'Admin and API paths cannot be redirected.', 'PROTECTED_REDIRECT_SOURCE')
  return path === '/' ? '/' : path.replace(/\/+$/, '')
}
function validateDestination(value, source) {
  const destination = String(value || '').trim().slice(0, 1000)
  if (destination.startsWith('/') && !destination.startsWith('//')) {
    const path = destination.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
    if (path === source) throw new CmsError(400, 'A redirect cannot point to itself.', 'REDIRECT_LOOP')
    return destination
  }
  try { const url = new URL(destination); if (url.protocol !== 'https:') throw new Error(); return destination } catch { throw new CmsError(400, 'Destination must be a site path or HTTPS URL.', 'INVALID_REDIRECT_DESTINATION') }
}

export async function onRequestGet(context) {
  const rows = await context.env.CMS_DB.prepare('SELECT * FROM seo_redirects ORDER BY updated_at DESC').all()
  return json({ ok: true, redirects: rows.results })
}

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request, 4096)
    const sourcePath = validatePath(body.sourcePath)
    const destination = validateDestination(body.destination, sourcePath)
    const statusCode = Number(body.statusCode) === 302 ? 302 : 301
    const id = crypto.randomUUID()
    await context.env.CMS_DB.prepare('INSERT INTO seo_redirects (id, source_path, destination, status_code, created_by) VALUES (?1, ?2, ?3, ?4, ?5)').bind(id, sourcePath, destination, statusCode, context.data.admin.username).run()
    await writeAudit(context.env, context.data.admin.username, 'create_redirect', 'redirect', id, { sourcePath, destination, statusCode })
    return json({ ok: true, redirect: { id, source_path: sourcePath, destination, status_code: statusCode, is_active: 1, hit_count: 0 } }, { status: 201 })
  } catch (error) { return handleCmsError(error, context.request) }
}

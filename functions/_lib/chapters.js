import { CmsError, readBinary, sanitizeFileName } from './cms.js'

export const CHAPTER_STATUSES = new Set(['draft', 'published', 'archived'])

export function publicChapter(row) {
  return {
    id: row.id,
    num: Number(row.chapter_number),
    title: row.title,
    pov: row.pov,
    status: row.status,
    file: row.source_kind === 'static' ? row.source_path : `/api/chronicle-chapters/${encodeURIComponent(row.id)}`,
    sourceKind: row.source_kind,
    fileName: row.file_name,
    sizeBytes: row.size_bytes == null ? null : Number(row.size_bytes),
    sortOrder: Number(row.sort_order),
    updatedAt: row.updated_at,
  }
}

export async function requireChronicle(env, contentId) {
  const content = await env.CMS_DB.prepare("SELECT id, slug, title FROM content_items WHERE id = ?1 AND type = 'chronicle'").bind(contentId).first()
  if (!content) throw new CmsError(404, 'Chronicle not found.', 'CHRONICLE_NOT_FOUND')
  return content
}

export function validateChapterNumber(value) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1 || number > 10000) throw new CmsError(400, 'Chapter number must be between 1 and 10000.', 'INVALID_CHAPTER_NUMBER')
  return number
}

export function validateChapterTitle(value) {
  const title = String(value || '').trim()
  if (!title || title.length > 200) throw new CmsError(400, 'Chapter title is required and must be 200 characters or fewer.', 'INVALID_CHAPTER_TITLE')
  return title
}

export async function readChapterHtml(request, env) {
  const maxBytes = Math.min(5 * 1024 * 1024, Math.max(64 * 1024, Number(env.CMS_MAX_CHAPTER_BYTES || 2 * 1024 * 1024)))
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  if (type && !['text/html', 'application/xhtml+xml', 'application/octet-stream'].includes(type)) {
    throw new CmsError(415, 'Choose an HTML file.', 'INVALID_CHAPTER_FILE_TYPE')
  }
  const bytes = await readBinary(request, maxBytes)
  let text
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { throw new CmsError(400, 'Chapter HTML must use UTF-8 encoding.', 'INVALID_CHAPTER_ENCODING') }
  if (text.includes('\0') || !/(?:<!doctype\s+html|<html[\s>])/i.test(text)) {
    throw new CmsError(400, 'The uploaded file must be a complete HTML document.', 'INVALID_CHAPTER_HTML')
  }
  return { bytes, sizeBytes: bytes.byteLength }
}

export function chapterFileName(value, number) {
  const name = sanitizeFileName(value || `chapter-${String(number).padStart(2, '0')}.html`)
  if (!/\.html?$/i.test(name)) throw new CmsError(400, 'Chapter files must end in .html or .htm.', 'INVALID_CHAPTER_FILE_NAME')
  return name
}

export function chapterResponse(object, { downloadName = null } = {}) {
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'private, no-store')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Content-Security-Policy', "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob:; media-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'")
  if (downloadName) {
    const safe = downloadName.replace(/["\\\r\n]/g, '_')
    headers.set('Content-Disposition', `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`)
  }
  return new Response(object.body, { headers })
}

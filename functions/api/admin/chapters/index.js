import {
  CHAPTER_STATUSES,
  chapterFileName,
  publicChapter,
  readChapterHtml,
  requireChronicle,
  validateChapterNumber,
  validateChapterTitle,
} from '../../../_lib/chapters.js'
import { CmsError, handleCmsError, json, writeAudit } from '../../../_lib/cms.js'

export async function onRequestGet(context) {
  try {
    const contentId = new URL(context.request.url).searchParams.get('contentId')
    await requireChronicle(context.env, contentId)
    const result = await context.env.CMS_DB.prepare(`
      SELECT * FROM chronicle_chapters WHERE content_id = ?1 ORDER BY sort_order, chapter_number
    `).bind(contentId).all()
    return json({ ok: true, chapters: result.results.map(publicChapter) })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export async function onRequestPost(context) {
  let r2Key
  let committed = false
  try {
    const url = new URL(context.request.url)
    const contentId = url.searchParams.get('contentId')
    await requireChronicle(context.env, contentId)
    const chapterNumber = validateChapterNumber(url.searchParams.get('number'))
    const title = validateChapterTitle(url.searchParams.get('title'))
    const pov = String(url.searchParams.get('pov') || '').trim().slice(0, 120) || null
    const status = url.searchParams.get('status') || 'draft'
    if (!CHAPTER_STATUSES.has(status)) throw new CmsError(400, 'Invalid chapter status.', 'INVALID_CHAPTER_STATUS')
    const fileName = chapterFileName(url.searchParams.get('fileName'), chapterNumber)
    const { bytes, sizeBytes } = await readChapterHtml(context.request, context.env)
    const id = crypto.randomUUID()
    r2Key = `chronicles/${contentId}/${id}/${fileName}`
    await context.env.CMS_ASSETS.put(r2Key, bytes, {
      httpMetadata: { contentType: 'text/html; charset=utf-8', cacheControl: 'private, no-store' },
      customMetadata: { contentId, chapterId: id },
    })
    const nextSort = Number(await context.env.CMS_DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 10 AS next_sort FROM chronicle_chapters WHERE content_id = ?1').bind(contentId).first('next_sort'))
    const now = new Date().toISOString()
    await context.env.CMS_DB.prepare(`
      INSERT INTO chronicle_chapters (
        id, content_id, chapter_number, title, pov, status, source_kind, r2_key,
        file_name, size_bytes, sort_order, created_by, created_at, updated_at, published_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'r2', ?7, ?8, ?9, ?10, ?11, ?12, ?12, ?13)
    `).bind(id, contentId, chapterNumber, title, pov, status, r2Key, fileName, sizeBytes, nextSort,
      context.data.admin.username, now, status === 'published' ? now : null).run()
    committed = true
    await writeAudit(context.env, context.data.admin.username, 'add_chapter', 'chapter', id, { contentId, chapterNumber, status })
    const chapter = await context.env.CMS_DB.prepare('SELECT * FROM chronicle_chapters WHERE id = ?1').bind(id).first()
    return json({ ok: true, chapter: publicChapter(chapter) }, { status: 201 })
  } catch (error) {
    if (r2Key && !committed) await context.env.CMS_ASSETS.delete(r2Key)
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return json({ ok: false, error: { code: 'CHAPTER_NUMBER_CONFLICT', message: 'That chapter number already exists.' } }, { status: 409 })
    }
    return handleCmsError(error, context.request)
  }
}

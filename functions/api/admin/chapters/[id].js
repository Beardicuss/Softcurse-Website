import {
  CHAPTER_STATUSES,
  chapterFileName,
  publicChapter,
  readChapterHtml,
  validateChapterNumber,
  validateChapterTitle,
} from '../../../_lib/chapters.js'
import { apiError, CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

async function findChapter(env, id) {
  return env.CMS_DB.prepare('SELECT * FROM chronicle_chapters WHERE id = ?1').bind(id).first()
}

export async function onRequestPatch(context) {
  try {
    const chapter = await findChapter(context.env, context.params.id)
    if (!chapter) return apiError(404, 'Chapter not found.', 'CHAPTER_NOT_FOUND')
    const payload = await readJson(context.request)
    if (payload.move === 'up' || payload.move === 'down') {
      const direction = payload.move === 'up' ? '<' : '>'
      const order = payload.move === 'up' ? 'DESC' : 'ASC'
      const neighbor = await context.env.CMS_DB.prepare(`
        SELECT id, sort_order FROM chronicle_chapters
        WHERE content_id = ?1 AND sort_order ${direction} ?2 ORDER BY sort_order ${order}, chapter_number ${order} LIMIT 1
      `).bind(chapter.content_id, chapter.sort_order).first()
      if (neighbor) {
        await context.env.CMS_DB.batch([
          context.env.CMS_DB.prepare('UPDATE chronicle_chapters SET sort_order = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2').bind(neighbor.sort_order, chapter.id),
          context.env.CMS_DB.prepare('UPDATE chronicle_chapters SET sort_order = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2').bind(chapter.sort_order, neighbor.id),
        ])
      }
      return json({ ok: true, moved: Boolean(neighbor) })
    }
    const chapterNumber = payload.number === undefined ? chapter.chapter_number : validateChapterNumber(payload.number)
    const title = payload.title === undefined ? chapter.title : validateChapterTitle(payload.title)
    const pov = payload.pov === undefined ? chapter.pov : String(payload.pov || '').trim().slice(0, 120) || null
    const status = payload.status ?? chapter.status
    if (!CHAPTER_STATUSES.has(status)) throw new CmsError(400, 'Invalid chapter status.', 'INVALID_CHAPTER_STATUS')
    const now = new Date().toISOString()
    const publishedAt = status === 'published' ? (chapter.published_at || now) : null
    await context.env.CMS_DB.prepare(`
      UPDATE chronicle_chapters SET chapter_number = ?1, title = ?2, pov = ?3, status = ?4,
        updated_at = ?5, published_at = ?6 WHERE id = ?7
    `).bind(chapterNumber, title, pov, status, now, publishedAt, chapter.id).run()
    await writeAudit(context.env, context.data.admin.username, 'update_chapter', 'chapter', chapter.id, { chapterNumber, status })
    return json({ ok: true, chapter: publicChapter(await findChapter(context.env, chapter.id)) })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return json({ ok: false, error: { code: 'CHAPTER_NUMBER_CONFLICT', message: 'That chapter number already exists.' } }, { status: 409 })
    }
    return handleCmsError(error, context.request)
  }
}

export async function onRequestPut(context) {
  let newKey
  let committed = false
  try {
    const chapter = await findChapter(context.env, context.params.id)
    if (!chapter) return apiError(404, 'Chapter not found.', 'CHAPTER_NOT_FOUND')
    const url = new URL(context.request.url)
    const fileName = chapterFileName(url.searchParams.get('fileName'), chapter.chapter_number)
    const { bytes, sizeBytes } = await readChapterHtml(context.request, context.env)
    newKey = `chronicles/${chapter.content_id}/${chapter.id}/${crypto.randomUUID()}-${fileName}`
    await context.env.CMS_ASSETS.put(newKey, bytes, {
      httpMetadata: { contentType: 'text/html; charset=utf-8', cacheControl: 'private, no-store' },
      customMetadata: { contentId: chapter.content_id, chapterId: chapter.id },
    })
    await context.env.CMS_DB.prepare(`
      UPDATE chronicle_chapters SET source_kind = 'r2', source_path = NULL, r2_key = ?1,
        file_name = ?2, size_bytes = ?3, updated_at = CURRENT_TIMESTAMP WHERE id = ?4
    `).bind(newKey, fileName, sizeBytes, chapter.id).run()
    committed = true
    if (chapter.source_kind === 'r2' && chapter.r2_key) context.waitUntil(context.env.CMS_ASSETS.delete(chapter.r2_key))
    await writeAudit(context.env, context.data.admin.username, 'replace_chapter_html', 'chapter', chapter.id, { fileName, sizeBytes })
    return json({ ok: true, chapter: publicChapter(await findChapter(context.env, chapter.id)) })
  } catch (error) {
    if (newKey && !committed) await context.env.CMS_ASSETS.delete(newKey)
    return handleCmsError(error, context.request)
  }
}

export async function onRequestDelete(context) {
  try {
    const chapter = await findChapter(context.env, context.params.id)
    if (!chapter) return apiError(404, 'Chapter not found.', 'CHAPTER_NOT_FOUND')
    await context.env.CMS_DB.prepare('DELETE FROM chronicle_chapters WHERE id = ?1').bind(chapter.id).run()
    if (chapter.source_kind === 'r2' && chapter.r2_key) context.waitUntil(context.env.CMS_ASSETS.delete(chapter.r2_key))
    await writeAudit(context.env, context.data.admin.username, 'delete_chapter', 'chapter', chapter.id, { contentId: chapter.content_id, chapterNumber: chapter.chapter_number })
    return json({ ok: true, deleted: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

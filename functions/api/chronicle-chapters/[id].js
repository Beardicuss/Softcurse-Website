import { chapterResponse } from '../../_lib/chapters.js'

export async function onRequestGet(context) {
  const chapter = await context.env.CMS_DB.prepare(`
    SELECT ch.* FROM chronicle_chapters ch JOIN content_items c ON c.id = ch.content_id
    WHERE ch.id = ?1 AND ch.source_kind = 'r2' AND ch.status = 'published' AND c.status = 'published'
  `).bind(context.params.id).first()
  if (!chapter) return new Response('Not found', { status: 404 })
  const object = await context.env.CMS_ASSETS.get(chapter.r2_key)
  if (!object) return new Response('Not found', { status: 404 })
  return chapterResponse(object)
}

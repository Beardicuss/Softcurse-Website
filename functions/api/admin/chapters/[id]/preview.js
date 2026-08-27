import { chapterResponse } from '../../../../_lib/chapters.js'

export async function onRequestGet(context) {
  const chapter = await context.env.CMS_DB.prepare('SELECT * FROM chronicle_chapters WHERE id = ?1').bind(context.params.id).first()
  if (!chapter) return new Response('Not found', { status: 404 })
  if (chapter.source_kind === 'static') {
    const url = new URL(chapter.source_path, context.request.url)
    const download = new URL(context.request.url).searchParams.get('download') === '1'
    if (!download) return Response.redirect(url.toString(), 302)
    const response = await fetch(url)
    if (!response.ok || !response.body) return new Response('Not found', { status: 404 })
    const safe = String(chapter.file_name || 'chapter.html').replace(/["\\\r\n]/g, '_')
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
  const object = await context.env.CMS_ASSETS.get(chapter.r2_key)
  if (!object) return new Response('Not found', { status: 404 })
  const download = new URL(context.request.url).searchParams.get('download') === '1'
  return chapterResponse(object, { downloadName: download ? chapter.file_name : null })
}

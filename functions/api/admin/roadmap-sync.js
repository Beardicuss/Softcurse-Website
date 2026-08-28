import { handleCmsError, json, readJson } from '../../_lib/cms.js'
import { applyRoadmapSync, previewRoadmapSync } from '../../_lib/roadmap.js'

export async function onRequestGet(context) {
  try {
    const preview = await previewRoadmapSync(context.env)
    return json({
      ok: true,
      changes: preview.changes,
      warnings: preview.warnings,
      content: preview.content,
      releases: preview.releases,
    })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

export async function onRequestPost(context) {
  try {
    const payload = await readJson(context.request)
    const onlyContentId = payload.contentId || null
    const result = await applyRoadmapSync(context.env, context.data.admin.username, onlyContentId)
    return json({ ok: true, changes: result.changes, warnings: result.warnings })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

import { apiError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

const MODEL = '@cf/meta/llama-3.2-3b-instruct'
const ACTIONS = {
  improve: 'Improve the writing for clarity, flow, and professionalism while preserving facts and intent. Return only the revised text.',
  summarize: 'Create a concise summary. Preserve important facts. Return only the summary.',
  seo: 'Create an SEO title under 60 characters and a meta description under 155 characters. Return plain text with labels Title: and Description:.',
  tags: 'Suggest up to 8 concise content tags. Return only a comma-separated list.',
  translate_ka: 'Translate into natural Georgian. Preserve names, product terminology, and formatting. Return only the translation.',
  translate_ru: 'Translate into natural Russian. Preserve names, product terminology, and formatting. Return only the translation.',
}

export async function onRequestPost(context) {
  let usageId
  try {
    if (!context.env.AI) return apiError(503, 'Workers AI is not configured for this environment.', 'AI_NOT_CONFIGURED')
    const body = await readJson(context.request, 16384)
    const action = String(body.action || '')
    const input = String(body.input || '').trim()
    if (!ACTIONS[action]) return apiError(400, 'Unsupported AI action.', 'INVALID_AI_ACTION')
    if (!input || input.length > 8000) return apiError(400, 'AI input must contain between 1 and 8,000 characters.', 'INVALID_AI_INPUT')
    const limit = Math.min(20, Math.max(1, Number(context.env.AI_DAILY_REQUEST_LIMIT || 10)))
    const used = Number(await context.env.CMS_DB.prepare("SELECT COUNT(*) AS count FROM admin_ai_usage WHERE created_at >= datetime('now', 'start of day')").first('count') || 0)
    if (used >= limit) return apiError(429, `The free AI safety limit of ${limit} requests has been reached for today.`, 'AI_DAILY_LIMIT')
    usageId = `ai-${crypto.randomUUID()}`
    await context.env.CMS_DB.prepare(`INSERT INTO admin_ai_usage (id, user_id, action, model, input_chars, status) VALUES (?1, ?2, ?3, ?4, ?5, 'started')`).bind(usageId, context.data.admin.id, action, MODEL, input.length).run()
    const result = await context.env.AI.run(MODEL, { messages: [{ role: 'system', content: `You are an editorial assistant inside the Softcurse website admin panel. Never invent facts. ${ACTIONS[action]}` }, { role: 'user', content: input }], max_tokens: 384, temperature: action.startsWith('translate') ? 0.2 : 0.4 })
    const output = String(result?.response || '').trim()
    if (!output) throw new Error('The AI model returned an empty response.')
    await context.env.CMS_DB.prepare("UPDATE admin_ai_usage SET status = 'completed', output_chars = ?1 WHERE id = ?2").bind(output.length, usageId).run()
    await writeAudit(context.env, context.data.admin.username, 'generate_suggestion', 'ai', usageId, { action, model: MODEL, inputChars: input.length, outputChars: output.length })
    return json({ ok: true, output, usage: { used: used + 1, limit } })
  } catch (error) {
    if (usageId) await context.env.CMS_DB.prepare("UPDATE admin_ai_usage SET status = 'failed' WHERE id = ?1").bind(usageId).run().catch(() => {})
    return handleCmsError(error, context.request)
  }
}

export async function onRequestGet(context) {
  const limit = Math.min(20, Math.max(1, Number(context.env.AI_DAILY_REQUEST_LIMIT || 10)))
  const used = Number(await context.env.CMS_DB.prepare("SELECT COUNT(*) AS count FROM admin_ai_usage WHERE created_at >= datetime('now', 'start of day')").first('count') || 0)
  return json({ ok: true, configured: Boolean(context.env.AI), model: MODEL, usage: { used, limit, remaining: Math.max(0, limit - used) } })
}


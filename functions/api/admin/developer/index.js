import { CmsError, handleCmsError, json, randomToken, readJson, sha256Hex, writeAudit } from '../../../_lib/cms.js'
import { decryptTotpSecret, encryptTotpSecret } from '../../../_lib/totp.js'
import { API_SCOPES, validExternalHttps, validSubresourceIntegrity } from '../../../_lib/developer.js'

function cleanName(value) { const name = String(value || '').trim().slice(0, 100); if (!name) throw new CmsError(400, 'A name is required.', 'NAME_REQUIRED'); return name }
async function hmac(secret, value) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('') }

export async function onRequestGet(context) {
  try {
    const [tokens, hooks, deliveries, flags, scripts] = await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare('SELECT id, name, token_hint, scopes_json, expires_at, last_used_at, request_count, revoked_at, created_by, created_at FROM api_tokens ORDER BY created_at DESC'),
      context.env.CMS_DB.prepare('SELECT id, name, url, events_json, enabled, created_by, created_at, updated_at FROM webhooks ORDER BY created_at DESC'),
      context.env.CMS_DB.prepare('SELECT d.*, w.name AS webhook_name FROM webhook_deliveries d JOIN webhooks w ON w.id = d.webhook_id ORDER BY d.created_at DESC LIMIT 50'),
      context.env.CMS_DB.prepare('SELECT * FROM feature_flags ORDER BY key'),
      context.env.CMS_DB.prepare('SELECT * FROM external_scripts ORDER BY created_at DESC'),
    ])
    return json({ ok: true, scopes: [...API_SCOPES], tokens: tokens.results.map(row => ({ ...row, scopes: JSON.parse(row.scopes_json) })), webhooks: hooks.results.map(row => ({ ...row, events: JSON.parse(row.events_json) })), deliveries: deliveries.results, flags: flags.results, scripts: scripts.results })
  } catch (error) { return handleCmsError(error, context.request) }
}

export async function onRequestPost(context) {
  try {
    const body = await readJson(context.request, 32_768)
    if (body.action === 'create_token') {
      const name = cleanName(body.name), scopes = [...new Set(Array.isArray(body.scopes) ? body.scopes : [])]
      if (!scopes.length || scopes.some(scope => !API_SCOPES.has(scope))) throw new CmsError(400, 'Choose at least one valid API scope.', 'INVALID_API_SCOPES')
      const days = Math.min(365, Math.max(1, Number(body.expiresDays || 90))), token = `sc_live_${randomToken(32)}`, id = crypto.randomUUID()
      await context.env.CMS_DB.prepare('INSERT INTO api_tokens (id, name, token_hash, token_hint, scopes_json, expires_at, created_by) VALUES (?1, ?2, ?3, ?4, ?5, datetime(CURRENT_TIMESTAMP, ?6), ?7)').bind(id, name, await sha256Hex(token), token.slice(-8), JSON.stringify(scopes), `+${days} days`, context.data.admin.username).run()
      await writeAudit(context.env, context.data.admin.username, 'create_api_token', 'api_token', id, { name, scopes })
      return json({ ok: true, token, id }, { status: 201 })
    }
    if (body.action === 'revoke_token') { await context.env.CMS_DB.prepare('UPDATE api_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?1 AND revoked_at IS NULL').bind(String(body.id)).run(); await writeAudit(context.env, context.data.admin.username, 'revoke_api_token', 'api_token', String(body.id)); return json({ ok: true }) }
    if (body.action === 'create_webhook') {
      const name = cleanName(body.name), url = String(body.url || '').trim(), events = [...new Set(Array.isArray(body.events) ? body.events : ['test'])]
      if (!validExternalHttps(url)) throw new CmsError(400, 'Webhook URL must be a public HTTPS destination.', 'INVALID_WEBHOOK_URL')
      const secret = `whsec_${randomToken(32)}`, id = crypto.randomUUID()
      await context.env.CMS_DB.prepare('INSERT INTO webhooks (id, name, url, events_json, secret_encrypted, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)').bind(id, name, url, JSON.stringify(events), await encryptTotpSecret(context.env, secret), context.data.admin.username).run()
      await writeAudit(context.env, context.data.admin.username, 'create_webhook', 'webhook', id, { name, url, events })
      return json({ ok: true, secret, id }, { status: 201 })
    }
    if (body.action === 'test_webhook') {
      const hook = await context.env.CMS_DB.prepare('SELECT * FROM webhooks WHERE id = ?1').bind(String(body.id)).first()
      if (!hook) throw new CmsError(404, 'Webhook not found.', 'WEBHOOK_NOT_FOUND')
      const deliveryId = crypto.randomUUID(), timestamp = String(Math.floor(Date.now() / 1000)), payload = JSON.stringify({ id: deliveryId, event: 'webhook.test', createdAt: new Date().toISOString(), data: { message: 'Softcurse webhook connection test' } }), started = Date.now()
      let responseStatus = null, status = 'failed', errorMessage = null
      try { const response = await fetch(hook.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'softcurse-webhooks/1.0', 'X-Softcurse-Event': 'webhook.test', 'X-Softcurse-Timestamp': timestamp, 'X-Softcurse-Signature': `v1=${await hmac(await decryptTotpSecret(context.env, hook.secret_encrypted), `${timestamp}.${payload}`)}` }, body: payload, signal: AbortSignal.timeout(10_000) }); responseStatus = response.status; status = response.ok ? 'delivered' : 'failed'; if (!response.ok) errorMessage = `HTTP ${response.status}` } catch (error) { errorMessage = error instanceof Error ? error.message.slice(0, 300) : 'Delivery failed' }
      await context.env.CMS_DB.prepare('INSERT INTO webhook_deliveries (id, webhook_id, event, status, response_status, duration_ms, error_message) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)').bind(deliveryId, hook.id, 'webhook.test', status, responseStatus, Date.now() - started, errorMessage).run()
      await writeAudit(context.env, context.data.admin.username, 'test_webhook', 'webhook', hook.id, { status, responseStatus })
      return json({ ok: status === 'delivered', status, responseStatus, error: errorMessage }, { status: status === 'delivered' ? 200 : 502 })
    }
    if (body.action === 'save_flag') { const key = String(body.key || '').trim().toLowerCase(); if (!/^[a-z][a-z0-9._-]{1,79}$/.test(key)) throw new CmsError(400, 'Use a lowercase feature key such as new.homepage.', 'INVALID_FEATURE_KEY'); await context.env.CMS_DB.prepare('INSERT INTO feature_flags (key, description, enabled, updated_by) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(key) DO UPDATE SET description = excluded.description, enabled = excluded.enabled, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP').bind(key, String(body.description || '').trim().slice(0, 300), body.enabled ? 1 : 0, context.data.admin.username).run(); await writeAudit(context.env, context.data.admin.username, 'save_feature_flag', 'feature_flag', key, { enabled: Boolean(body.enabled) }); return json({ ok: true }) }
    if (body.action === 'save_script') { const name = cleanName(body.name), src = String(body.src || '').trim(), location = body.location === 'body_end' ? 'body_end' : 'head', integrity = String(body.integrity || '').trim().slice(0, 200); if (!validExternalHttps(src)) throw new CmsError(400, 'Script source must be a public HTTPS URL.', 'INVALID_SCRIPT_URL'); if (body.enabled && !validSubresourceIntegrity(integrity)) throw new CmsError(400, 'Enabled external scripts require a valid SHA-256, SHA-384, or SHA-512 integrity value.', 'SCRIPT_INTEGRITY_REQUIRED'); const id = String(body.id || crypto.randomUUID()); await context.env.CMS_DB.prepare('INSERT INTO external_scripts (id, name, src, location, enabled, integrity, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ON CONFLICT(id) DO UPDATE SET name = excluded.name, src = excluded.src, location = excluded.location, enabled = excluded.enabled, integrity = excluded.integrity, updated_at = CURRENT_TIMESTAMP').bind(id, name, src, location, body.enabled ? 1 : 0, integrity || null, context.data.admin.username).run(); await writeAudit(context.env, context.data.admin.username, 'save_external_script', 'external_script', id, { src, enabled: Boolean(body.enabled) }); return json({ ok: true, id }) }
    throw new CmsError(400, 'Unknown developer action.', 'INVALID_DEVELOPER_ACTION')
  } catch (error) { return handleCmsError(error, context.request) }
}

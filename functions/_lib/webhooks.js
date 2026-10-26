import { decryptTotpSecret } from './totp.js'

async function signature(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function dispatchWebhooks(env, event, data) {
  const result = await env.CMS_DB.prepare('SELECT * FROM webhooks WHERE enabled = 1').all()
  await Promise.all(result.results.filter(hook => { const events = JSON.parse(hook.events_json); return events.includes('*') || events.includes(event) }).map(async hook => {
    const id = crypto.randomUUID(), timestamp = String(Math.floor(Date.now() / 1000)), body = JSON.stringify({ id, event, createdAt: new Date().toISOString(), data }), started = Date.now()
    let status = 'failed', responseStatus = null, errorMessage = null
    try {
      const digest = await signature(await decryptTotpSecret(env, hook.secret_encrypted), `${timestamp}.${body}`)
      const response = await fetch(hook.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'softcurse-webhooks/1.0', 'X-Softcurse-Event': event, 'X-Softcurse-Timestamp': timestamp, 'X-Softcurse-Signature': `v1=${digest}` }, body, signal: AbortSignal.timeout(10_000) })
      responseStatus = response.status; status = response.ok ? 'delivered' : 'failed'; if (!response.ok) errorMessage = `HTTP ${response.status}`
    } catch (error) { errorMessage = error instanceof Error ? error.message.slice(0, 300) : 'Delivery failed' }
    await env.CMS_DB.prepare('INSERT INTO webhook_deliveries (id, webhook_id, event, status, response_status, duration_ms, error_message) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)').bind(id, hook.id, event, status, responseStatus, Date.now() - started, errorMessage).run()
  }))
}

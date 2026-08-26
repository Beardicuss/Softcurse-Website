const MAX_BODY_BYTES = 32_768
const RESEND_TIMEOUT_MS = 10_000
const TURNSTILE_TIMEOUT_MS = 10_000

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function isSameOrigin(request) {
  const origin = request.headers.get('Origin')
  return !origin || origin === new URL(request.url).origin
}

function hasValidBodyType(request) {
  return request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')
}

function isBodyTooLarge(request) {
  const value = request.headers.get('Content-Length')
  if (!value) return false

  const length = Number(value)
  return !Number.isFinite(length) || length > MAX_BODY_BYTES
}

async function readJsonBody(request) {
  if (!request.body) return { error: 'Invalid JSON body.' }

  const reader = request.body.getReader()
  const chunks = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    totalBytes += value.byteLength
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel()
      return { tooLarge: true }
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return { body: JSON.parse(new TextDecoder().decode(bytes)) }
  } catch {
    return { error: 'Invalid JSON body.' }
  }
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  if (!cleaned || cleaned.length > maxLength) return null
  return cleaned
}

function optionalText(value, maxLength) {
  if (value === undefined || value === null || value === '') return ''
  return cleanText(value, maxLength)
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

async function verifyTurnstile(request, env, token, expectedAction) {
  const expectedHostnames = new Set(
    (env.TURNSTILE_HOSTNAMES || '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  )

  if (
    !env.TURNSTILE_SECRET
    || typeof token !== 'string'
    || token.length === 0
    || token.length > 2_048
    || expectedHostnames.size === 0
  ) {
    return false
  }

  const form = new URLSearchParams({
    secret: env.TURNSTILE_SECRET,
    response: token,
    // A unique key makes a replay a distinct validation operation. Reuse this
    // key only when retrying the same outbound Siteverify request.
    idempotency_key: crypto.randomUUID(),
  })
  const clientIp = request.headers.get('CF-Connecting-IP')
  if (clientIp) form.set('remoteip', clientIp)

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
    })
    if (!response.ok) return false

    const result = await response.json()
    return result.success === true
      && result.action === expectedAction
      && expectedHostnames.has(result.hostname)
  } catch {
    return false
  }
}

export async function onRequestPost(context) {
  const { request, env } = context

  if (!isSameOrigin(request)) {
    return jsonResponse({ ok: false, error: 'Request origin is not allowed.' }, 403)
  }

  if (!hasValidBodyType(request)) {
    return jsonResponse({ ok: false, error: 'Content-Type must be application/json.' }, 415)
  }

  if (isBodyTooLarge(request)) {
    return jsonResponse({ ok: false, error: 'Request body is too large.' }, 413)
  }

  const parsed = await readJsonBody(request)
  if (parsed.tooLarge) {
    return jsonResponse({ ok: false, error: 'Request body is too large.' }, 413)
  }
  if (parsed.error) return jsonResponse({ ok: false, error: parsed.error }, 400)
  const body = parsed.body

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400)
  }

  if (!await verifyTurnstile(request, env, body.turnstileToken, 'contact')) {
    return jsonResponse({ ok: false, error: 'Security verification failed.' }, 403)
  }

  // Honeypot: do not reveal bot detection behavior.
  if (typeof body._trap === 'string' && body._trap.trim()) {
    return jsonResponse({ ok: true })
  }

  const name = cleanText(body.name, 100)
  const email = cleanText(body.email, 254)
  const subject = optionalText(body.subject, 160)
  const message = cleanText(body.message, 5_000)

  if (!name || !email || !isValidEmail(email) || subject === null || !message) {
    return jsonResponse({ ok: false, error: 'Please check the submitted fields.' }, 400)
  }

  const apiKey = env.RESEND_API_KEY
  if (!apiKey) {
    console.error('contact_configuration_missing', { binding: 'RESEND_API_KEY' })
    return jsonResponse({ ok: false, error: 'The contact service is unavailable.' }, 503)
  }

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject || '—')
  const safeMessage = escapeHtml(message)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'softcurse-website/1.2',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM_EMAIL || 'Softcurse Contact <onboarding@resend.dev>',
        to: [env.CONTACT_TO_EMAIL || 'softcurse69@gmail.com'],
        reply_to: email,
        subject: `[Softcurse] ${subject || 'New message'} — from ${name}`,
        html: `
          <div style="font-family:monospace;background:#0B0C10;color:#E5E5E5;padding:2rem;border-left:3px solid #00FFFF">
            <h2 style="color:#00FFFF;margin-top:0">NEW MESSAGE FROM SOFTCURSE SYSTEMS</h2>
            <p><strong style="color:#00FFFF">Name:</strong> ${safeName}</p>
            <p><strong style="color:#00FFFF">Email:</strong> ${safeEmail}</p>
            <p><strong style="color:#00FFFF">Subject:</strong> ${safeSubject}</p>
            <hr style="border-color:#1C1E26;margin:1rem 0" />
            <p><strong style="color:#00FFFF">Message:</strong></p>
            <p style="white-space:pre-wrap;color:#AAAAAA">${safeMessage}</p>
          </div>
        `,
      }),
      signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.error('contact_resend_failed', { status: response.status })
      return jsonResponse({ ok: false, error: 'The message could not be sent.' }, 502)
    }

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('contact_resend_request_failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    return jsonResponse({ ok: false, error: 'The contact service is unavailable.' }, 503)
  }
}

function methodNotAllowed() {
  const response = jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)
  response.headers.set('Allow', 'POST')
  return response
}

export const onRequestGet = methodNotAllowed
export const onRequestOptions = methodNotAllowed
export const onRequestPut = methodNotAllowed
export const onRequestPatch = methodNotAllowed
export const onRequestDelete = methodNotAllowed

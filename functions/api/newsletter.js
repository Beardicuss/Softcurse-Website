const MAX_BODY_BYTES = 4_096
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

function isValidEmail(value) {
  return typeof value === 'string'
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function resendRequest(apiKey, path, method, body) {
  return fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'softcurse-website/1.2',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
  })
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

export async function onRequestPost(context) {
  const { request, env } = context
  const origin = request.headers.get('Origin')

  if (origin && origin !== new URL(request.url).origin) {
    return jsonResponse({ ok: false, error: 'Request origin is not allowed.' }, 403)
  }

  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return jsonResponse({ ok: false, error: 'Content-Type must be application/json.' }, 415)
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0)
  if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) {
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

  if (!await verifyTurnstile(request, env, body.turnstileToken, 'newsletter')) {
    return jsonResponse({ ok: false, error: 'Security verification failed.' }, 403)
  }

  if (typeof body._trap === 'string' && body._trap.trim()) {
    return jsonResponse({ ok: true })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!isValidEmail(email)) {
    return jsonResponse({ ok: false, error: 'Enter a valid email address.' }, 400)
  }

  const apiKey = env.RESEND_API_KEY
  if (!apiKey) {
    console.error('newsletter_configuration_missing', { binding: 'RESEND_API_KEY' })
    return jsonResponse({ ok: false, error: 'Newsletter signup is unavailable.' }, 503)
  }

  try {
    let response = await resendRequest(apiKey, '/contacts', 'POST', {
      email,
      unsubscribed: false,
    })

    // A repeat signup is explicit consent to restore an existing subscription.
    if (response.status === 409) {
      response = await resendRequest(apiKey, `/contacts/${encodeURIComponent(email)}`, 'PATCH', {
        unsubscribed: false,
      })
    }

    if (!response.ok) {
      console.error('newsletter_resend_failed', { status: response.status })
      return jsonResponse({ ok: false, error: 'Newsletter signup failed.' }, 502)
    }

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('newsletter_resend_request_failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    return jsonResponse({ ok: false, error: 'Newsletter signup is unavailable.' }, 503)
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

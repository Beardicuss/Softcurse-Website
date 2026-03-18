/**
 * Cloudflare Pages Function — POST /api/contact
 * Receives form data, sends email via Resend.
 * API key is stored as environment variable RESEND_API_KEY in Cloudflare dashboard.
 */
export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  try {
    const body = await context.request.json()
    const { name, email, subject, message, _trap } = body

    // Honeypot — silently reject bots
    if (_trap) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })
    }

    // Basic validation
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const apiKey = context.env.RESEND_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Server misconfigured' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Softcurse Contact <onboarding@resend.dev>',
        to:   ['softcurse69@gmail.com'],
        reply_to: email,
        subject: `[Softcurse] ${subject || 'New message'} — from ${name}`,
        html: `
          <div style="font-family:monospace;background:#0B0C10;color:#E5E5E5;padding:2rem;border-left:3px solid #00FFFF">
            <h2 style="color:#00FFFF;margin-top:0">NEW MESSAGE FROM SOFTCURSE.DEV</h2>
            <p><strong style="color:#00FFFF">Name:</strong> ${name}</p>
            <p><strong style="color:#00FFFF">Email:</strong> ${email}</p>
            <p><strong style="color:#00FFFF">Subject:</strong> ${subject || '—'}</p>
            <hr style="border-color:#1C1E26;margin:1rem 0"/>
            <p><strong style="color:#00FFFF">Message:</strong></p>
            <p style="white-space:pre-wrap;color:#AAAAAA">${message}</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to send email' }),
        { status: 500, headers: corsHeaders }
      )
    }

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders })

  } catch (err) {
    console.error('Contact function error:', err)
    return new Response(
      JSON.stringify({ ok: false, error: 'Server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}

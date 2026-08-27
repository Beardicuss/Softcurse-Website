import assert from 'node:assert/strict'

const baseUrl = new URL(process.env.SMOKE_BASE_URL || 'https://softcursesystems.pages.dev')
const maxAttempts = 6

async function fetchWithRetry(path, init) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(new URL(path, baseUrl), init)
      if (response.ok) return response
      lastError = new Error(`${path} returned HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
    if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, attempt * 1000))
  }
  throw lastError
}

async function verifyPage(path) {
  const response = await fetchWithRetry(path)
  assert.match(response.headers.get('content-type') || '', /text\/html/i, `${path} must return HTML`)
  const body = await response.text()
  assert.match(body, /<div id="root"><\/div>/, `${path} must return the application shell`)
  return response
}

async function verifyAsset(path, expectedType) {
  const response = await fetchWithRetry(path)
  assert.match(response.headers.get('content-type') || '', expectedType, `${path} has the wrong content type`)
  assert.ok((await response.arrayBuffer()).byteLength > 1000, `${path} is unexpectedly empty`)
}

console.log(`Smoke testing ${baseUrl.origin}`)

const home = await verifyPage('/')
for (const path of ['/lab', '/studio', '/studio/fakechecker', '/localization', '/admin']) {
  await verifyPage(path)
}

assert.equal(home.headers.get('x-content-type-options'), 'nosniff')
assert.equal(home.headers.get('x-frame-options'), 'SAMEORIGIN')
assert.equal(home.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
assert.match(home.headers.get('strict-transport-security') || '', /max-age=31536000/)

const contentResponse = await fetchWithRetry('/api/content')
assert.match(contentResponse.headers.get('cache-control') || '', /public, max-age=30/)
const content = await contentResponse.json()
assert.equal(content.ok, true)
assert.ok(Array.isArray(content.items) && content.items.length > 0, 'CMS content must not be empty')
const fakeChecker = content.items.find(item => item.type === 'game' && item.slug === 'fakechecker')
assert.ok(fakeChecker, 'Fake Checker must exist in published CMS content')
assert.equal(fakeChecker.data.playUrl, 'https://fakechecker.pages.dev/')

const sessionResponse = await fetchWithRetry('/api/admin-session')
assert.match(sessionResponse.headers.get('cache-control') || '', /no-store/)
const session = await sessionResponse.json()
assert.deepEqual(session, { ok: true, authenticated: false, user: null })

const sitemap = await (await fetchWithRetry('/sitemap.xml')).text()
assert.match(sitemap, /<urlset/)
assert.match(sitemap, /https:\/\/softcursesystems\.pages\.dev\/studio\/fakechecker/)

await verifyAsset('/posters/games/fakechecker.webp', /image\/webp/i)
await verifyAsset('/posters/games/fakechecker-char.webp', /image\/webp/i)
await verifyAsset('/posters/games/page/fakechecker-page.webp', /image\/webp/i)
await verifyAsset('/posters/games/hexbrewers.webp', /image\/webp/i)

console.log('Production smoke checks passed.')

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CmsError,
  isSafeSlug,
  legacyContentSlugs,
  managedContentKeys,
  parseCookies,
  sanitizeFileName,
  sessionCookie,
  slugify,
  validateProviderUrl,
  validateContentPayload,
  validateRoadmapData,
} from '../functions/_lib/cms.js'
import { deriveRoadmapStatus } from '../functions/_lib/roadmap.js'
import { formatBytes, makeSlug } from '../src/admin/api.js'
import { normalizeEmail } from '../functions/_lib/commerce.js'
import { chapterFileName, chapterResponse, readChapterHtml, validateChapterNumber, validateChapterTitle } from '../functions/_lib/chapters.js'

test('slug helpers create safe, stable content slugs', () => {
  assert.equal(slugify('  Fake Checker!  '), 'fake-checker')
  assert.equal(makeSlug('GELA Mobile / Beta'), 'gela-mobile-beta')
  assert.equal(isSafeSlug('hexbrewers-from-ashenveil'), true)
  assert.equal(isSafeSlug('Unsafe Slug'), false)
  assert.equal(isSafeSlug('-leading-hyphen'), false)
})

test('renamed seeded content still suppresses its original static fallback', () => {
  assert.deepEqual(
    legacyContentSlugs({ id: 'seed-app-ytdl', type: 'app', slug: 'smd' }),
    ['ytdl'],
  )
  assert.deepEqual(
    managedContentKeys({ id: 'seed-app-ytdl', type: 'app', slug: 'smd' }),
    ['app:smd', 'app:ytdl'],
  )
  assert.deepEqual(
    managedContentKeys({ id: 'custom-app-id', type: 'app', slug: 'new-tool' }),
    ['app:new-tool'],
  )
})

test('file names are safe for release metadata', () => {
  assert.equal(sanitizeFileName('../Fake Checker: Setup?.exe'), 'Fake-Checker-Setup-.exe')
  assert.equal(sanitizeFileName(''), 'file')
})

test('admin cookie helpers preserve encoded values and security attributes', () => {
  const request = new Request('https://softcursesystems.pages.dev/admin', {
    headers: { cookie: 'theme=dark; sc_admin_session=a%2Fb%2Bc' },
  })
  assert.deepEqual(parseCookies(request), { theme: 'dark', sc_admin_session: 'a/b+c' })

  const cookie = sessionCookie('token/value', 3600)
  assert.match(cookie, /^sc_admin_session=token%2Fvalue;/)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /Secure/)
  assert.match(cookie, /SameSite=Strict/)
})

test('content validation accepts complete records and rejects invalid mutations', () => {
  assert.doesNotThrow(() => validateContentPayload({
    type: 'game',
    slug: 'fake-checker',
    title: 'Fake Checker',
    status: 'published',
    sortOrder: 1,
    data: { status: 'active' },
  }))

  assert.throws(
    () => validateContentPayload({ type: 'game', slug: 'Bad Slug', title: 'Bad', data: {} }),
    error => error instanceof CmsError && error.code === 'INVALID_SLUG',
  )
  assert.throws(
    () => validateContentPayload({ status: 'deleted' }, true),
    error => error instanceof CmsError && error.code === 'INVALID_STATUS',
  )
})

test('roadmap milestones validate manual and automatic records', () => {
  assert.doesNotThrow(() => validateRoadmapData({
    quarter: 'Now',
    items: [
      { id: 'manual-item', title: 'Manual item', type: 'LAB', status: 'planned', desc: '', syncMode: 'manual' },
      { id: 'release-item', title: 'Release item', type: 'STUDIO', status: 'in-progress', syncMode: 'release', linkedContentId: 'game-1', linkedReleaseId: 'release-1' },
    ],
  }))
  assert.throws(
    () => validateRoadmapData({ quarter: 'Later', items: [{ id: 'bad', title: 'Bad link', type: 'LAB', status: 'next', syncMode: 'release', linkedContentId: 'app-1' }] }),
    error => error instanceof CmsError && error.code === 'ROADMAP_RELEASE_LINK_REQUIRED',
  )
  assert.throws(
    () => validateRoadmapData({ quarter: 'Later', items: [{ id: 'same', title: 'One', type: 'LAB', status: 'planned' }, { id: 'same', title: 'Two', type: 'LAB', status: 'planned' }] }),
    error => error instanceof CmsError && error.code === 'INVALID_ROADMAP_ITEM_ID',
  )
})

test('roadmap automation derives statuses without changing manual milestones', () => {
  const content = new Map([
    ['active-project', { id: 'active-project', status: 'published', data_json: JSON.stringify({ status: 'active' }) }],
    ['beta-project', { id: 'beta-project', status: 'published', data_json: JSON.stringify({ status: 'beta' }) }],
  ])
  const releases = new Map([
    ['published-release', { id: 'published-release', content_id: 'active-project', status: 'published', label: 'Download' }],
    ['draft-release', { id: 'draft-release', content_id: 'beta-project', status: 'draft', label: 'Preview' }],
  ])
  assert.equal(deriveRoadmapStatus({ status: 'planned', syncMode: 'manual' }, content, releases).status, 'planned')
  assert.equal(deriveRoadmapStatus({ status: 'planned', syncMode: 'content', linkedContentId: 'active-project' }, content, releases).status, 'done')
  assert.equal(deriveRoadmapStatus({ status: 'planned', syncMode: 'content', linkedContentId: 'beta-project' }, content, releases).status, 'in-progress')
  assert.equal(deriveRoadmapStatus({ status: 'planned', syncMode: 'release', linkedContentId: 'active-project', linkedReleaseId: 'published-release' }, content, releases).status, 'done')
  assert.equal(deriveRoadmapStatus({ status: 'planned', syncMode: 'release', linkedContentId: 'beta-project', linkedReleaseId: 'draft-release' }, content, releases).status, 'in-progress')
})

test('storage metrics format predictable byte values', () => {
  assert.equal(formatBytes(0), '0 B')
  assert.equal(formatBytes(1024), '1.0 KB')
  assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB')
})

test('release provider URLs require HTTPS and match the selected host', () => {
  assert.equal(validateProviderUrl('github', 'https://github.com/Softcurse/project/releases/latest').startsWith('https://github.com/'), true)
  assert.equal(validateProviderUrl('mega', 'https://mega.nz/file/example#key').startsWith('https://mega.nz/'), true)
  assert.throws(
    () => validateProviderUrl('github', 'https://mega.nz/file/example'),
    error => error instanceof CmsError && error.code === 'PROVIDER_URL_MISMATCH',
  )
  assert.throws(
    () => validateProviderUrl('custom', 'http://downloads.example.com/setup.exe'),
    error => error instanceof CmsError && error.code === 'INVALID_EXTERNAL_URL',
  )
})

test('commerce identities normalize email without retaining display variants', () => {
  assert.equal(normalizeEmail('  Customer@Example.COM '), 'customer@example.com')
  assert.throws(
    () => normalizeEmail('not-an-email'),
    error => error instanceof CmsError && error.code === 'INVALID_CUSTOMER_EMAIL',
  )
})

test('chapter metadata and HTML uploads are bounded and validated', async () => {
  assert.equal(validateChapterNumber('10'), 10)
  assert.equal(validateChapterTitle('  Omega-Class Asset  '), 'Omega-Class Asset')
  assert.equal(chapterFileName('chapter-10.html', 10), 'chapter-10.html')
  assert.throws(() => validateChapterNumber(0), error => error instanceof CmsError && error.code === 'INVALID_CHAPTER_NUMBER')
  assert.throws(() => chapterFileName('chapter.txt', 1), error => error instanceof CmsError && error.code === 'INVALID_CHAPTER_FILE_NAME')

  const html = '<!doctype html><html><body>Chapter</body></html>'
  const request = new Request('https://example.com/api/admin/chapters', {
    method: 'POST',
    headers: { 'Content-Type': 'text/html', 'Content-Length': String(Buffer.byteLength(html)) },
    body: html,
  })
  const upload = await readChapterHtml(request, { CMS_MAX_CHAPTER_BYTES: '2048' })
  assert.equal(upload.sizeBytes, Buffer.byteLength(html))
})

test('managed chapter responses run inside an isolated content sandbox', async () => {
  const response = chapterResponse({
    body: '<!doctype html><title>Chapter</title>',
    httpEtag: '"chapter-etag"',
    writeHttpMetadata() {},
  })
  const policy = response.headers.get('content-security-policy')
  assert.match(policy, /^sandbox allow-scripts;/)
  assert.doesNotMatch(policy, /allow-same-origin/)
  assert.match(policy, /connect-src 'none'/)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
})

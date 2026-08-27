import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CmsError,
  isSafeSlug,
  parseCookies,
  sanitizeFileName,
  sessionCookie,
  slugify,
  validateProviderUrl,
  validateContentPayload,
} from '../functions/_lib/cms.js'
import { formatBytes, makeSlug } from '../src/admin/api.js'
import { normalizeEmail } from '../functions/_lib/commerce.js'

test('slug helpers create safe, stable content slugs', () => {
  assert.equal(slugify('  Fake Checker!  '), 'fake-checker')
  assert.equal(makeSlug('GELA Mobile / Beta'), 'gela-mobile-beta')
  assert.equal(isSafeSlug('hexbrewers-from-ashenveil'), true)
  assert.equal(isSafeSlug('Unsafe Slug'), false)
  assert.equal(isSafeSlug('-leading-hyphen'), false)
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

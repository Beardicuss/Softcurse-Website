import { CmsError, handleCmsError, json, readJson, writeAudit } from '../../../_lib/cms.js'

const KEYS = ['site', 'seo', 'maintenance']

function cleanString(value, max, fallback = '') { return String(value ?? fallback).trim().slice(0, max) }
function cleanPath(value) {
  const path = cleanString(value, 200)
  if (!path.startsWith('/') || path.startsWith('//')) throw new CmsError(400, 'Excluded paths must begin with one slash.', 'INVALID_PATH')
  return path === '/' ? '/' : path.replace(/\/+$/, '')
}
function cleanUrl(value, allowPath = false) {
  const text = cleanString(value, 500)
  if (!text) return ''
  if (allowPath && text.startsWith('/') && !text.startsWith('//')) return text
  try { const url = new URL(text); if (!['https:', 'mailto:'].includes(url.protocol)) throw new Error(); return text } catch { throw new CmsError(400, 'Use a valid HTTPS URL.', 'INVALID_URL') }
}
function validate(key, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CmsError(400, 'Settings must be an object.', 'INVALID_SETTINGS')
  if (key === 'site') return {
    name: cleanString(value.name, 100, 'Softcurse Systems'), tagline: cleanString(value.tagline, 200), description: cleanString(value.description, 500),
    contactEmail: cleanString(value.contactEmail, 200), themeColor: /^#[0-9a-f]{6}$/i.test(value.themeColor || '') ? value.themeColor : '#4ffff0',
    logoUrl: cleanUrl(value.logoUrl, true), faviconUrl: cleanUrl(value.faviconUrl, true),
    socials: Object.fromEntries(['github', 'youtube', 'discord', 'x'].map(name => [name, cleanUrl(value.socials?.[name])])),
  }
  if (key === 'seo') return {
    titleTemplate: cleanString(value.titleTemplate, 120, '%s — Softcurse Systems'), defaultTitle: cleanString(value.defaultTitle, 100, 'Softcurse Systems'),
    defaultDescription: cleanString(value.defaultDescription, 320), defaultOgImage: cleanUrl(value.defaultOgImage, true), robotsIndex: value.robotsIndex !== false,
    sitemapEnabled: value.sitemapEnabled !== false, excludedPaths: [...new Set((Array.isArray(value.excludedPaths) ? value.excludedPaths : []).map(cleanPath))].slice(0, 100),
  }
  return { enabled: Boolean(value.enabled), title: cleanString(value.title, 100, 'Maintenance in progress'), message: cleanString(value.message, 500), allowAdmins: value.allowAdmins !== false }
}

export async function onRequestGet(context) {
  const [rows, revisions] = await context.env.CMS_DB.batch([
    context.env.CMS_DB.prepare(`SELECT key, value_json, updated_by, updated_at FROM settings WHERE key IN ('site','seo','maintenance') ORDER BY key`),
    context.env.CMS_DB.prepare(`SELECT id, setting_key, changed_by, created_at FROM settings_revisions ORDER BY created_at DESC LIMIT 20`),
  ])
  return json({ ok: true, settings: Object.fromEntries(rows.results.map(row => [row.key, { ...JSON.parse(row.value_json), _updatedBy: row.updated_by, _updatedAt: row.updated_at }])), revisions: revisions.results })
}

export async function onRequestPatch(context) {
  try {
    const body = await readJson(context.request, 16384)
    const key = String(body.key || '')
    if (!KEYS.includes(key)) throw new CmsError(400, 'Unknown settings group.', 'INVALID_SETTINGS_GROUP')
    const value = validate(key, body.value)
    const serialized = JSON.stringify(value)
    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare('INSERT INTO settings_revisions (setting_key, value_json, changed_by) VALUES (?1, ?2, ?3)').bind(key, serialized, context.data.admin.username),
      context.env.CMS_DB.prepare(`INSERT INTO settings (key, value_json, updated_by, updated_at) VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`).bind(key, serialized, context.data.admin.username),
    ])
    await writeAudit(context.env, context.data.admin.username, 'update_settings', 'settings', key)
    return json({ ok: true, key, value })
  } catch (error) { return handleCmsError(error, context.request) }
}

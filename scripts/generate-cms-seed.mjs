/* global URL, console */
import { writeFile } from 'node:fs/promises'
import { APPS } from '../src/data/apps.js'
import { POSTS } from '../src/data/blog.js'
import { CHRONICLES } from '../src/data/chronicles.js'
import { EXPERIMENTS } from '../src/data/experiments.js'
import { GAMES } from '../src/data/games.js'
import { LOCALIZATIONS } from '../src/data/localizations.js'
import { ROADMAP } from '../src/data/roadmap.js'

const quote = value => `'${String(value).replaceAll("'", "''")}'`
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const rows = [
  ...Object.values(GAMES).map(value => ['game', value.id, value.name, value]),
  ...Object.values(APPS).map(value => ['app', value.id, value.name, value]),
  ...Object.values(EXPERIMENTS).map(value => ['experiment', value.id, value.name, value]),
  ...Object.values(LOCALIZATIONS).map(value => ['localization', value.id, value.name, value]),
  ...Object.values(CHRONICLES).map(value => ['chronicle', value.id, value.name, value]),
  ...POSTS.map(value => ['blog', value.id, value.title, value]),
  ...ROADMAP.map((value, index) => ['roadmap', `roadmap-${index}-${slug(value.quarter)}`, value.quarter, value]),
]

const sql = ['PRAGMA foreign_keys = ON;', '']
for (const [type, itemSlug, title, source] of rows) {
  const id = `seed-${type}-${itemSlug}`
  const data = { ...source }
  delete data.id
  delete data.name
  delete data.title
  sql.push(`INSERT OR IGNORE INTO content_items (id, type, slug, title, status, sort_order, data_json, published_at) VALUES (${quote(id)}, ${quote(type)}, ${quote(itemSlug)}, ${quote(title)}, 'published', ${rows.indexOf(rows.find(row => row[0] === type && row[1] === itemSlug))}, ${quote(JSON.stringify(data))}, CURRENT_TIMESTAMP);`)
  sql.push(`INSERT OR IGNORE INTO content_revisions (content_id, revision, action, data_json, created_by) VALUES (${quote(id)}, 1, 'seed', ${quote(JSON.stringify(data))}, 'system');`)
  if (source.playUrl) {
    const releaseId = `seed-release-${type}-${itemSlug}`
    sql.push(`INSERT OR IGNORE INTO releases (id, content_id, kind, label, version, platform, external_url, status, is_primary, created_by, published_at) VALUES (${quote(releaseId)}, ${quote(id)}, 'web', ${quote(source.launchLabel || (type === 'game' ? 'PLAY NOW' : 'LAUNCH'))}, ${source.version ? quote(source.version) : 'NULL'}, 'web', ${quote(source.playUrl)}, 'published', 1, 'system', CURRENT_TIMESTAMP);`)
  }
  sql.push('')
}

await writeFile(new URL('../migrations/0002_seed_existing_content.sql', import.meta.url), `${sql.join('\n')}\n`)
console.log(`Generated seed migration for ${rows.length} content items.`)

import {
  apiError,
  CmsError,
  handleCmsError,
  json,
  parseContentRow,
  readJson,
  validateContentPayload,
  writeAudit,
} from '../../../_lib/cms.js'

async function findItem(env, id) {
  return env.CMS_DB.prepare('SELECT * FROM content_items WHERE id = ?1').bind(id).first()
}

export async function onRequestGet(context) {
  const row = await findItem(context.env, context.params.id)
  if (!row) return apiError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')

  const [assets, releases, revisions, commerce] = await context.env.CMS_DB.batch([
    context.env.CMS_DB.prepare('SELECT * FROM assets WHERE content_id = ?1 ORDER BY slot').bind(row.id),
    context.env.CMS_DB.prepare('SELECT * FROM releases WHERE content_id = ?1 ORDER BY is_primary DESC, sort_order, created_at DESC').bind(row.id),
    context.env.CMS_DB.prepare(`
      SELECT id, revision, action, created_by, created_at
      FROM content_revisions WHERE content_id = ?1 ORDER BY revision DESC LIMIT 30
    `).bind(row.id),
    context.env.CMS_DB.prepare('SELECT * FROM commerce_products WHERE content_id = ?1').bind(row.id),
  ])

  return json({ ok: true, item: parseContentRow(row), assets: assets.results, releases: releases.results, revisions: revisions.results, commerce: commerce.results[0] || null })
}

export async function onRequestPatch(context) {
  try {
    const existing = await findItem(context.env, context.params.id)
    if (!existing) return apiError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')

    const payload = await readJson(context.request)
    validateContentPayload(payload, true)
    if (payload.type && payload.type !== existing.type) {
      throw new CmsError(400, 'Content type cannot be changed after creation.', 'TYPE_IMMUTABLE')
    }

    const next = {
      slug: payload.slug ?? existing.slug,
      title: payload.title?.trim() ?? existing.title,
      status: payload.status ?? existing.status,
      sortOrder: payload.sortOrder ?? existing.sort_order,
      data: payload.data ?? JSON.parse(existing.data_json),
    }
    const now = new Date().toISOString()
    const publishedAt = next.status === 'published' ? (existing.published_at || now) : null
    const revision = Number(await context.env.CMS_DB.prepare(`
      SELECT COALESCE(MAX(revision), 0) + 1 AS next_revision FROM content_revisions WHERE content_id = ?1
    `).bind(existing.id).first('next_revision'))
    const dataJson = JSON.stringify(next.data)

    await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare(`
        UPDATE content_items SET slug = ?1, title = ?2, status = ?3, sort_order = ?4,
          data_json = ?5, updated_at = ?6, published_at = ?7 WHERE id = ?8
      `).bind(next.slug, next.title, next.status, next.sortOrder, dataJson, now, publishedAt, existing.id),
      context.env.CMS_DB.prepare(`
        INSERT INTO content_revisions (content_id, revision, action, data_json, created_by, created_at)
        VALUES (?1, ?2, 'update', ?3, ?4, ?5)
      `).bind(existing.id, revision, dataJson, context.data.admin.username, now),
    ])

    await writeAudit(context.env, context.data.admin.username, 'update', existing.type, existing.id, {
      fromStatus: existing.status,
      toStatus: next.status,
      revision,
    })

    return json({ ok: true, item: parseContentRow(await findItem(context.env, existing.id)) })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return apiError(409, 'That slug is already in use for this content type.', 'SLUG_CONFLICT')
    }
    return handleCmsError(error, context.request)
  }
}

export async function onRequestDelete(context) {
  try {
    const existing = await findItem(context.env, context.params.id)
    if (!existing) return apiError(404, 'Content item not found.', 'CONTENT_NOT_FOUND')

    const url = new URL(context.request.url)
    if (url.searchParams.get('permanent') !== 'true') {
      await context.env.CMS_DB.prepare(`
        UPDATE content_items SET status = 'archived', updated_at = CURRENT_TIMESTAMP, published_at = NULL WHERE id = ?1
      `).bind(existing.id).run()
      await writeAudit(context.env, context.data.admin.username, 'archive', existing.type, existing.id)
      return json({ ok: true, archived: true })
    }

    const objects = await context.env.CMS_DB.prepare(`
      SELECT r2_key FROM assets WHERE content_id = ?1
      UNION ALL
      SELECT r2_key FROM releases WHERE content_id = ?1 AND r2_key IS NOT NULL
      UNION ALL
      SELECT r2_key FROM chronicle_chapters WHERE content_id = ?1 AND r2_key IS NOT NULL
    `).bind(existing.id).all()

    if (objects.results.length) {
      await context.env.CMS_ASSETS.delete(objects.results.map(row => row.r2_key))
    }
    await context.env.CMS_DB.prepare('DELETE FROM content_items WHERE id = ?1').bind(existing.id).run()
    await writeAudit(context.env, context.data.admin.username, 'delete_permanently', existing.type, existing.id, { slug: existing.slug })
    return json({ ok: true, deleted: true })
  } catch (error) {
    return handleCmsError(error, context.request)
  }
}

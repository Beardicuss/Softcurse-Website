import { CmsError } from './cms.js'

// Ordered parents before children. Authentication, active sessions, API tokens,
// audit history, and system metadata are deliberately excluded from restoration.
export const RESTORABLE_TABLES = [
  'content_items', 'content_revisions', 'assets', 'releases', 'chronicle_chapters',
  'commerce_products', 'commerce_inventory', 'customers', 'orders', 'order_items',
  'entitlements', 'licenses', 'payment_events', 'download_tokens', 'coupons', 'refunds', 'invoices',
  'media_folders', 'media_items', 'media_usage', 'settings', 'settings_revisions', 'seo_redirects',
  'form_definitions', 'contact_messages', 'contact_message_events', 'blog_comments',
  'page_analytics_daily', 'feature_flags', 'external_scripts', 'webhooks', 'webhook_deliveries',
]

export const MAX_RESTORE_BYTES = 10 * 1024 * 1024
export const MAX_RESTORE_RECORDS = 20_000

export function validateBackupDocument(document) {
  if (!document || document.format !== 'softcurse-d1-backup' || document.version !== 1 || !document.tables || typeof document.tables !== 'object' || Array.isArray(document.tables)) {
    throw new CmsError(400, 'This file is not a supported Softcurse database backup.', 'INVALID_BACKUP_FORMAT')
  }
  let recordCount = 0
  const tables = {}
  for (const name of RESTORABLE_TABLES) {
    const rows = document.tables[name] || []
    if (!Array.isArray(rows)) throw new CmsError(400, `Backup table ${name} is invalid.`, 'INVALID_BACKUP_TABLE')
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new CmsError(400, `Backup table ${name} contains an invalid record.`, 'INVALID_BACKUP_RECORD')
      for (const key of Object.keys(row)) if (!/^[a-z][a-z0-9_]*$/.test(key)) throw new CmsError(400, `Backup table ${name} contains an invalid column.`, 'INVALID_BACKUP_COLUMN')
    }
    recordCount += rows.length
    if (recordCount > MAX_RESTORE_RECORDS) throw new CmsError(413, 'The backup contains too many records for guarded restore.', 'BACKUP_TOO_LARGE')
    tables[name] = rows
  }
  return { tables, recordCount, createdAt: typeof document.createdAt === 'string' ? document.createdAt : null }
}

export function restoreConfirmation(backupId) {
  return `RESTORE ${backupId}`
}

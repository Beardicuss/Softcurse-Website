import { CmsError, sha256Hex } from './cms.js'

export const COMMENT_STATUSES = new Set(['pending', 'approved', 'rejected', 'spam'])

export function cleanCommentText(value, maxLength, field) {
  const text = String(value || '').trim().replace(/\r\n/g, '\n')
  if (!text || text.length > maxLength) throw new CmsError(400, `${field} is required and must be ${maxLength.toLocaleString()} characters or fewer.`, `INVALID_COMMENT_${field.toUpperCase().replaceAll(' ', '_')}`)
  return text
}

export function cleanCommentName(value) {
  return cleanCommentText(value, 80, 'author name').replace(/[<>]/g, '')
}

export function cleanCommentBody(value) {
  return cleanCommentText(value, 3000, 'body')
}

export function cleanCommentEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  if (!email) return ''
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CmsError(400, 'Enter a valid email address.', 'INVALID_COMMENT_EMAIL')
  return email
}

export async function privateCommentHash(env, type, value) {
  if (!value) return null
  return sha256Hex(`${env.COMMENT_PRIVACY_SALT || env.ADMIN_PASSWORD || 'softcurse-comments'}:${type}:${value}`)
}

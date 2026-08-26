export async function adminApi(path, options = {}) {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof Blob) && !(options.body instanceof ArrayBuffer)) headers.set('Content-Type', 'application/json')
  const endpoint = path === '/auth/session' ? '/api/admin-session' : `/api/admin${path}`
  const response = await fetch(endpoint, { credentials: 'same-origin', ...options, headers })
  const payload = await response.json().catch(() => ({ ok: false, error: { message: 'The server returned an unreadable response.' } }))
  if (!response.ok) throw new Error(payload.error?.message || `Request failed (${response.status})`)
  return payload
}

export function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`
}

export function makeSlug(value) {
  return String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

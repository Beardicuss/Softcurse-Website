import { useMemo } from 'react'
import { getApps } from '../data/apps'
import { getGames } from '../data/games'
import { POSTS } from '../data/blog'

/**
 * Searches apps, games, and blog posts.
 * Returns results grouped by type, or [] if query is empty/too short.
 * @param {string} query
 */
export function useSearch(query) {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return { apps: [], games: [], posts: [], total: 0 }

    const match = (str) => (str || '').toLowerCase().includes(q)

    const apps = getApps().filter(a =>
      match(a.name) || match(a.tag) || match(a.shortDesc) || match(a.desc)
    )

    const games = getGames().filter(g =>
      match(g.name) || match(g.tag) || match(g.genre) || match(g.shortDesc) || match(g.desc)
    )

    const posts = POSTS.filter(p =>
      match(p.title) || match(p.excerpt) || match(p.category) || match(p.content)
    )

    return { apps, games, posts, total: apps.length + games.length + posts.length }
  }, [query])
}

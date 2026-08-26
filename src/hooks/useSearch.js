import { useMemo } from 'react'
import { APPS } from '../data/apps'
import { GAMES } from '../data/games'
import { LOCALIZATIONS } from '../data/localizations'
import { POSTS } from '../data/blog'
import { useCmsItems } from '../content/CmsContent'

const STATIC_APPS = Object.values(APPS)
const STATIC_GAMES = Object.values(GAMES)
const STATIC_LOCALIZATIONS = Object.values(LOCALIZATIONS)

/**
 * Searches apps, games, and blog posts.
 * Returns results grouped by type, or [] if query is empty/too short.
 * @param {string} query
 */
export function useSearch(query) {
  const allApps = useCmsItems('app', STATIC_APPS)
  const allGames = useCmsItems('game', STATIC_GAMES)
  const allLocalizations = useCmsItems('localization', STATIC_LOCALIZATIONS)
  const allPosts = useCmsItems('blog', POSTS)
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return { apps: [], games: [], localizations: [], posts: [], total: 0 }

    const match = (str) => (str || '').toLowerCase().includes(q)

    const apps = allApps.filter(a =>
      match(a.name) || match(a.tag) || match(a.shortDesc) || match(a.desc)
    )

    const games = allGames.filter(g =>
      match(g.name) || match(g.tag) || match(g.genre) || match(g.shortDesc) || match(g.desc)
    )

    const localizations = allLocalizations.filter(item =>
      match(item.name) || match(item.tag) || match(item.shortDesc) || match(item.desc)
    )

    const posts = allPosts.filter(p =>
      match(p.title) || match(p.excerpt) || match(p.category) || match(p.content)
    )

    return { apps, games, localizations, posts, total: apps.length + games.length + localizations.length + posts.length }
  }, [allApps, allGames, allLocalizations, allPosts, query])
}

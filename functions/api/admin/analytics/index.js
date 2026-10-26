import { handleCmsError, json } from '../../../_lib/cms.js'

export async function onRequestGet(context) {
  try {
    const [totals, timeline, pages, sources, devices, countries] = await context.env.CMS_DB.batch([
      context.env.CMS_DB.prepare("SELECT COALESCE(SUM(views), 0) AS views, COUNT(DISTINCT day) AS active_days FROM page_analytics_daily WHERE day >= date('now', '-29 days')"),
      context.env.CMS_DB.prepare("SELECT day, SUM(views) AS views FROM page_analytics_daily WHERE day >= date('now', '-29 days') GROUP BY day ORDER BY day"),
      context.env.CMS_DB.prepare("SELECT path, SUM(views) AS views FROM page_analytics_daily WHERE day >= date('now', '-29 days') GROUP BY path ORDER BY views DESC LIMIT 12"),
      context.env.CMS_DB.prepare("SELECT source, SUM(views) AS views FROM page_analytics_daily WHERE day >= date('now', '-29 days') GROUP BY source ORDER BY views DESC LIMIT 10"),
      context.env.CMS_DB.prepare("SELECT device, SUM(views) AS views FROM page_analytics_daily WHERE day >= date('now', '-29 days') GROUP BY device ORDER BY views DESC"),
      context.env.CMS_DB.prepare("SELECT country, SUM(views) AS views FROM page_analytics_daily WHERE day >= date('now', '-29 days') GROUP BY country ORDER BY views DESC LIMIT 10"),
    ])
    return json({ ok: true, period: 30, totalViews: Number(totals.results[0]?.views || 0), activeDays: Number(totals.results[0]?.active_days || 0), timeline: timeline.results.map(row => ({ ...row, views: Number(row.views) })), pages: pages.results.map(row => ({ ...row, views: Number(row.views) })), sources: sources.results.map(row => ({ ...row, views: Number(row.views) })), devices: devices.results.map(row => ({ ...row, views: Number(row.views) })), countries: countries.results.map(row => ({ ...row, views: Number(row.views) })) })
  } catch (error) { return handleCmsError(error, context.request) }
}

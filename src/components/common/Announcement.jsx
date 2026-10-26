import { Link } from 'react-router-dom'
import { useSiteLayout } from '../../content/SiteLayout'

export default function Announcement() {
  const item = useSiteLayout()?.announcement
  if (!item?.enabled || !item.text) return null
  const content = <>{item.text}{item.link && <span>{item.label || 'LEARN MORE'} →</span>}</>
  return <div className="site-announcement" role="status">{item.link ? (item.link.startsWith('http') ? <a href={item.link} target="_blank" rel="noopener noreferrer">{content}</a> : <Link to={item.link}>{content}</Link>) : content}</div>
}

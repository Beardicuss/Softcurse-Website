import { Link } from 'react-router-dom'
import styles from './Button.module.css'

/**
 * Softcurse multi-variant button.
 * Uses React Router <Link> for internal hrefs to avoid full page reloads.
 * @param {'cyan'|'magenta'|'outline'|'outlineMagenta'|'ghost'} variant
 */
export default function Button({
  children, variant = 'cyan', onClick, href, external,
  className = '', type = 'button', disabled, ...rest
}) {
  const variantMap = {
    'outline-magenta': styles.outlineMagenta,
    'outlineMagenta':  styles.outlineMagenta,
  }
  const variantClass = variantMap[variant] ?? styles[variant] ?? ''
  const cls = [styles.btn, variantClass, className, disabled ? styles.disabled : '']
    .filter(Boolean).join(' ')

  if (external) {
    return <a href={external} className={cls} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
  }
  if (href) {
    return <Link to={href} className={cls} {...rest}>{children}</Link>
  }
  return <button className={cls} onClick={onClick} type={type} disabled={disabled} {...rest}>{children}</button>
}

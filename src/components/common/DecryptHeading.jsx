import { useTextDecrypt } from '../../hooks/useTextDecrypt'

/**
 * Heading that decrypts its text when visible.
 * <DecryptHeading as="h2" visible={visible} className={styles.title}>
 *   SOFTCURSE LAB
 * </DecryptHeading>
 */
export default function DecryptHeading({ as: Tag = 'h2', children, visible, className = '', speed = 32, iterations = 5 }) {
  const text    = typeof children === 'string' ? children : ''
  const decrypted = useTextDecrypt(text, visible, speed, iterations)

  // If children are not plain string (have JSX spans etc), just reveal normally
  if (!text) {
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <Tag className={className} aria-label={text}>
      {visible ? decrypted : text.replace(/[^ ]/g, '█')}
    </Tag>
  )
}

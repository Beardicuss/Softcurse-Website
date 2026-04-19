import { useEffect, useState } from 'react'

const SESSION_KEY = 'sc_first_load_done'

/**
 * Returns true once, on the first page render after the boot screen.
 * Subsequent navigations within the same session return false.
 * Resets on hard refresh (sessionStorage cleared).
 */
export function useFirstLoad() {
  const [isFirst, setIsFirst] = useState(false)

  useEffect(() => {
    const done = sessionStorage.getItem(SESSION_KEY)
    if (!done) {
      setIsFirst(true)
      sessionStorage.setItem(SESSION_KEY, '1')
    }
  }, [])

  return isFirst
}

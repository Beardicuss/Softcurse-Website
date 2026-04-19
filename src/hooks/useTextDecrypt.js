import { useState, useEffect, useRef } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&<>[]{}/?'

/**
 * Returns a decrypted string that randomises chars then resolves to `text`.
 * @param {string}  text        - final text
 * @param {boolean} trigger     - start when true
 * @param {number}  speed       - ms per reveal step (default 40)
 * @param {number}  iterations  - scramble passes per character (default 6)
 */
export function useTextDecrypt(text = '', trigger = false, speed = 38, iterations = 6) {
  const [output, setOutput] = useState(text.replace(/[^ ]/g, '█'))
  const frame = useRef(0)
  const raf   = useRef(null)

  useEffect(() => {
    if (!trigger) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOutput(text); return
    }

    frame.current = 0
    const totalFrames = text.length * iterations

    const tick = () => {
      frame.current++
      const revealed = Math.floor(frame.current / iterations)

      setOutput(
        text.split('').map((char, i) => {
          if (char === ' ') return ' '
          if (i < revealed)  return char
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        }).join('')
      )

      if (frame.current < totalFrames) {
        raf.current = setTimeout(tick, speed)
      } else {
        setOutput(text)
      }
    }

    raf.current = setTimeout(tick, 80) // small delay before starting
    return () => clearTimeout(raf.current)
  }, [trigger, text, speed, iterations])

  return output
}

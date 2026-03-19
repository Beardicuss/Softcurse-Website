import { useCountUp } from '../../hooks/useCountUp'

/**
 * Animated stat number — counts up from 0 when `run` becomes true.
 * Non-numeric values (∞) display immediately.
 */
export default function StatNumber({ value, run, className }) {
  const displayed = useCountUp(value, run, 1600)
  return <span className={className}>{displayed}</span>
}

import { useEffect, useState } from 'react'

/** `value`, once it has stopped changing for `delay` ms: a search box asks once per pause, not per key. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return settled
}

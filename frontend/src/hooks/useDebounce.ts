import { useState, useEffect } from 'react'

/**
 * Returns a debounced version of the provided value.
 * Useful for delaying search API calls until the user stops typing.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 400ms)
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

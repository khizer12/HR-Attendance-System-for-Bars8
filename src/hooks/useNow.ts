import { useEffect, useState } from 'react';

/**
 * Returns the current Date, refreshed every `intervalMs` milliseconds.
 * Pass `enabled = false` to stop the timer (saves renders when idle).
 *
 * @example
 *   const now = useNow(1000, state === 'ON_BREAK');
 */
export function useNow(intervalMs = 1000, enabled = true): Date {
  const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
    if (!enabled) return;

    const id = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [intervalMs, enabled]);

  return now;
}   
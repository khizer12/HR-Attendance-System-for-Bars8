import { useCallback, useEffect, useState } from 'react';

import { listSchedules, type Schedule } from '@/features/schedules/api';

export interface UseSchedulesResult {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSchedules(): UseSchedulesResult {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listSchedules();
      setSchedules(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await listSchedules();
        if (cancelled) return;
        setSchedules(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load schedules.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { schedules, loading, error, refresh: load };
}
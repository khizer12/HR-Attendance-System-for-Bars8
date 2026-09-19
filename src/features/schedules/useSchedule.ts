import { useCallback, useEffect, useState } from 'react';

import { getScheduleById, type Schedule } from '@/features/schedules/api';

export interface UseScheduleResult {
  schedule: Schedule | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSchedule(id: string | undefined): UseScheduleResult {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setSchedule(null);
      setLoading(false);
      return;
    }
    try {
      const next = await getScheduleById(id);
      setSchedule(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) {
        if (!cancelled) {
          setSchedule(null);
          setLoading(false);
        }
        return;
      }
      try {
        const next = await getScheduleById(id);
        if (cancelled) return;
        setSchedule(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load schedule.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { schedule, loading, error, refresh: load };
}
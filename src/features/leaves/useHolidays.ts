import { useCallback, useEffect, useState } from 'react';

import { listHolidays } from '@/features/leaves/holidayApi';
import type { Holiday } from '@/types/leave';

export interface UseHolidaysResult {
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHolidays(): UseHolidaysResult {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listHolidays();
      setHolidays(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load holidays.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listHolidays();
        if (cancelled) return;
        setHolidays(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load holidays.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { holidays, loading, error, refresh: load };
}
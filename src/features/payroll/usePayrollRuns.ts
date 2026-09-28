import { useCallback, useEffect, useState } from 'react';

import { listPayrollRuns } from '@/features/payroll/runApi';
import type { PayrollRun } from '@/types/payroll';

export interface UsePayrollRunsResult {
  runs: PayrollRun[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePayrollRuns(): UsePayrollRunsResult {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listPayrollRuns();
      setRuns(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load runs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listPayrollRuns();
        if (cancelled) return;
        setRuns(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load runs.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { runs, loading, error, refresh: load };
}
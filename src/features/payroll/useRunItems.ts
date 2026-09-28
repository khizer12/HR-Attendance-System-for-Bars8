import { useCallback, useEffect, useState } from 'react';

import { getPayrollRun, listRunItems } from '@/features/payroll/runApi';
import type { PayrollItem, PayrollRun } from '@/types/payroll';

export interface UseRunItemsResult {
  run: PayrollRun | null;
  items: PayrollItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRunItems(
  runId: string | undefined,
): UseRunItemsResult {
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!runId) {
      setRun(null);
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const [r, i] = await Promise.all([
        getPayrollRun(runId),
        listRunItems(runId),
      ]);
      setRun(r);
      setItems(i);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load run.');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!runId) {
        if (!cancelled) {
          setRun(null);
          setItems([]);
          setLoading(false);
        }
        return;
      }
      try {
        const [r, i] = await Promise.all([
          getPayrollRun(runId),
          listRunItems(runId),
        ]);
        if (cancelled) return;
        setRun(r);
        setItems(i);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load run.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  return { run, items, loading, error, refresh: load };
}
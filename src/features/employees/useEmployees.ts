import { useCallback, useEffect, useState } from 'react';

import { listEmployees, type EmployeeRow } from '@/features/employees/api';

export interface UseEmployeesResult {
  rows: EmployeeRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEmployees(): UseEmployeesResult {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listEmployees();
      setRows(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await listEmployees();
        if (cancelled) return;
        setRows(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load employees.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, error, refresh: load };
}
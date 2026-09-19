import { useCallback, useEffect, useState } from 'react';

import { getEmployeeById, type EmployeeRow } from '@/features/employees/api';

export interface UseEmployeeResult {
  employee: EmployeeRow | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEmployee(id: string | undefined): UseEmployeeResult {
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setEmployee(null);
      setLoading(false);
      return;
    }
    try {
      const next = await getEmployeeById(id);
      setEmployee(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employee.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) {
        if (!cancelled) {
          setEmployee(null);
          setLoading(false);
        }
        return;
      }
      try {
        const next = await getEmployeeById(id);
        if (cancelled) return;
        setEmployee(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load employee.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { employee, loading, error, refresh: load };
}
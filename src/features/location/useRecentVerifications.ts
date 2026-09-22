import { useEffect, useState } from 'react';

import {
  fetchRecentVerificationsForEmployee,
  type EmployeeVerificationRow,
} from '@/features/location/api';

export interface UseRecentVerificationsResult {
  rows: EmployeeVerificationRow[];
  loading: boolean;
  error: string | null;
}

export function useRecentVerifications(
  employeeId: string | undefined,
  limit = 30,
): UseRecentVerificationsResult {
  const [rows, setRows] = useState<EmployeeVerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!employeeId) {
        if (cancelled) return;
        setRows([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        const next = await fetchRecentVerificationsForEmployee(
          employeeId,
          limit,
        );
        if (cancelled) return;
        setRows(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load verifications.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeId, limit]);

  return { rows, loading, error };
}
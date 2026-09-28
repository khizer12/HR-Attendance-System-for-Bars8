import { useCallback, useEffect, useState } from 'react';

import { listAllLeaveRequests } from '@/features/leaves/api';
import type { LeaveRequestWithMeta } from '@/types/leave';

export interface UseAdminLeaveRequestsResult {
  rows: LeaveRequestWithMeta[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAdminLeaveRequests(
  statusFilter?: 'pending' | 'approved' | 'rejected' | 'cancelled',
): UseAdminLeaveRequestsResult {
  const [rows, setRows] = useState<LeaveRequestWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listAllLeaveRequests(statusFilter);
      setRows(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await listAllLeaveRequests(statusFilter);
        if (cancelled) return;
        setRows(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load requests.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  return { rows, loading, error, refresh: load };
}
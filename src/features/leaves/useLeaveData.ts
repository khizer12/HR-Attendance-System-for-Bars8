import { useCallback, useEffect, useState } from 'react';

import {
  fetchMyLeaveBalances,
  listLeaveTypes,
  listMyLeaveRequests,
} from '@/features/leaves/api';
import type {
  LeaveBalance,
  LeaveRequestWithMeta,
  LeaveType,
} from '@/types/leave';

export interface UseLeaveDataResult {
  types: LeaveType[];
  requests: LeaveRequestWithMeta[];
  balances: LeaveBalance[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeaveData(): UseLeaveDataResult {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequestWithMeta[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, r, b] = await Promise.all([
        listLeaveTypes(),
        listMyLeaveRequests(),
        fetchMyLeaveBalances(),
      ]);
      setTypes(t);
      setRequests(r);
      setBalances(b);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leave data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [t, r, b] = await Promise.all([
          listLeaveTypes(),
          listMyLeaveRequests(),
          fetchMyLeaveBalances(),
        ]);
        if (cancelled) return;
        setTypes(t);
        setRequests(r);
        setBalances(b);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load leave data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { types, requests, balances, loading, error, refresh: load };
}
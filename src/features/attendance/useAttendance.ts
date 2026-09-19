import { useCallback, useEffect, useState } from 'react';

import {
  fetchAttendanceHistory,
  fetchTodaySummary,
  rpcClockIn,
  rpcClockOut,
  rpcEndBreak,
  rpcStartBreak,
  type TodaySummaryRow,
} from '@/services/attendance/api';
import {
  applyAction,
  type AttendanceAction,
} from '@/services/attendance/stateMachine';
import type { AttendanceRecord, AttendanceState } from '@/types/attendance';

export interface UseAttendanceResult {
  state: AttendanceState;
  summary: TodaySummaryRow | null;
  history: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  actionInProgress: AttendanceAction | null;

  clockIn: () => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  clockOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAttendance(): UseAttendanceResult {
  const [summary, setSummary] = useState<TodaySummaryRow | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] =
    useState<AttendanceAction | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextSummary, nextHistory] = await Promise.all([
        fetchTodaySummary(),
        fetchAttendanceHistory(),
      ]);
      setSummary(nextSummary);
      setHistory(nextHistory);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load. Inlined so React Compiler can see that no setState
  // runs synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [nextSummary, nextHistory] = await Promise.all([
          fetchTodaySummary(),
          fetchAttendanceHistory(),
        ]);
        if (cancelled) return;
        setSummary(nextSummary);
        setHistory(nextHistory);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load attendance.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const state: AttendanceState =
    (summary?.state ?? 'NOT_CHECKED_IN') as AttendanceState;

  const run = useCallback(
    async (action: AttendanceAction, fn: () => Promise<void>) => {
      setError(null);

      const check = applyAction(state, action);
      if (!check.ok) {
        setError(check.reason);
        return;
      }

      setActionInProgress(action);
      try {
        await fn();
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Action failed.');
      } finally {
        setActionInProgress(null);
      }
    },
    [state, load],
  );

  const clockIn = useCallback(() => run('clock_in', rpcClockIn), [run]);
  const startBreak = useCallback(() => run('start_break', rpcStartBreak), [run]);
  const endBreak = useCallback(() => run('end_break', rpcEndBreak), [run]);
  const clockOut = useCallback(() => run('clock_out', rpcClockOut), [run]);

  return {
    state,
    summary,
    history,
    loading,
    error,
    actionInProgress,
    clockIn,
    startBreak,
    endBreak,
    clockOut,
    refresh: load,
  };
}
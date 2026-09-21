import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth';
import { getBrowserLocation, usePeriodicVerification } from '@/features/location';
import { useSchedule } from '@/features/schedules';
import {
  fetchAttendanceHistory,
  fetchBreaksForAttendance,
  fetchTodaySummary,
  rpcClockIn,
  rpcClockOut,
  rpcEndBreak,
  rpcStartBreak,
  type BreakRow,
  type ClockInLocation,
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
  breaks: BreakRow[];
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
  const { profile } = useAuth();
  const { schedule } = useSchedule(profile?.schedule_id ?? undefined);

  const [summary, setSummary] = useState<TodaySummaryRow | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [breaks, setBreaks] = useState<BreakRow[]>([]);
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
      const nextBreaks = await fetchBreaksForAttendance(
        nextSummary.attendance_id,
      );
      setSummary(nextSummary);
      setHistory(nextHistory);
      setBreaks(nextBreaks);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load. Inlined so React Compiler can verify no setState
  // runs synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [nextSummary, nextHistory] = await Promise.all([
          fetchTodaySummary(),
          fetchAttendanceHistory(),
        ]);
        const nextBreaks = await fetchBreaksForAttendance(
          nextSummary.attendance_id,
        );
        if (cancelled) return;
        setSummary(nextSummary);
        setHistory(nextHistory);
        setBreaks(nextBreaks);
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

  usePeriodicVerification({
    attendanceId: summary?.attendance_id ?? null,
    clockOutAt: summary?.clock_out_at ?? null,
    locationRequired: schedule?.location_required ?? false,
    intervalMinutes: schedule?.verification_interval_minutes ?? 30,
  });

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

  /**
   * Clock-in wrapper that acquires browser geolocation first when the
   * employee's schedule requires it.
   *
   * Key behaviors:
   *   - If location_required=false: no prompt, calls rpcClockIn(null).
   *   - If location_required=true and geolocation succeeds: passes coords.
   *   - If location_required=true and geolocation fails: throws with a
   *     user-friendly message. The RPC is NOT called, so no attendance
   *     row is created and no verification row is fabricated.
   *
   * The `run` wrapper handles loading state, error display, and the
   * reload-after-success — even when the error originated here.
   */
  const clockIn = useCallback(
    () =>
      run('clock_in', async () => {
        let location: ClockInLocation | null = null;

        if (schedule?.location_required) {
          const result = await getBrowserLocation();
          if (!result.ok) {
            throw new Error(
              result.status === 'permission_denied'
                ? 'Location permission is required to clock in. ' +
                  'Enable it in your browser settings and try again.'
                : `Could not determine your location: ${result.message}`,
            );
          }
          location = {
            latitude: result.latitude,
            longitude: result.longitude,
            accuracyMeters: result.accuracy_meters,
          };
        }

        await rpcClockIn(location);
      }),
    [run, schedule],
  );

  const startBreak = useCallback(() => run('start_break', rpcStartBreak), [run]);
  const endBreak = useCallback(() => run('end_break', rpcEndBreak), [run]);
  const clockOut = useCallback(() => run('clock_out', rpcClockOut), [run]);

  return {
    state,
    summary,
    history,
    breaks,
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
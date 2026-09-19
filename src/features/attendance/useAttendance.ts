import { useState } from 'react';

import type { AttendanceRecord, AttendanceState } from '@/types/attendance';

export interface UseAttendanceResult {
  /** Current state machine value. */
  state: AttendanceState;
  /** Recent attendance records, newest first. */
  history: AttendanceRecord[];
  /** True while the initial load is in progress. */
  loading: boolean;
  /** Human-readable error from the last failed action. */
  error: string | null;
  /** True while a clock-in / break / clock-out action is in flight. */
  actionInProgress: boolean;

  clockIn: () => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  clockOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Phase 4: returns a static "NOT_CHECKED_IN" state.
 * Phase 5 will replace the internals with real Supabase calls and a
 * state machine that rejects invalid transitions.
 */
export function useAttendance(): UseAttendanceResult {
  const [error, setError] = useState<string | null>(null);

  const notImplemented = (action: string) => async () => {
    setError(`${action} will be enabled in Phase 5 (Attendance Engine).`);
  };

  const refresh = async () => {
    setError(null);
  };

  return {
    state: 'NOT_CHECKED_IN',
    history: [],
    loading: false,
    error,
    actionInProgress: false,
    clockIn: notImplemented('Clock in'),
    startBreak: notImplemented('Start break'),
    endBreak: notImplemented('End break'),
    clockOut: notImplemented('Clock out'),
    refresh,
  };
}
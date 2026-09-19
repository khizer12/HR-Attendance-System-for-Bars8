/**
 * Attendance domain types.
 * Mirrors the shape Phase 5 will store in Postgres.
 */

/** Attendance state machine — see spec Rule 1–21 for transition rules. */
export type AttendanceState =
  | 'NOT_CHECKED_IN'
  | 'CHECKED_IN'
  | 'ON_BREAK'
  | 'BACK_FROM_BREAK'
  | 'CHECKED_OUT';

/** Lateness outcome relative to the assigned schedule. */
export type AttendanceStatus = 'on_time' | 'late' | 'absent';

/** One work session for one employee for one business day. */
export interface AttendanceRecord {
  id: string;
  employee_id: string;
  /** YYYY-MM-DD in business timezone. */
  work_date: string;
  /** ISO timestamp, UTC. Null until the employee clocks in. */
  clock_in_at: string | null;
  /** ISO timestamp, UTC. Null while still working. */
  clock_out_at: string | null;
  status: AttendanceStatus | null;
  total_work_minutes: number | null;
  total_break_minutes: number | null;
  /** ISO timestamps, UTC. */
  created_at: string;
  updated_at: string;
}

/** One break within a work session. */
export interface BreakRecord {
  id: string;
  attendance_id: string;
  break_start_at: string;
  break_end_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

/** Aggregated snapshot of the current user's day. */
export interface TodaySummary {
  state: AttendanceState;
  /** YYYY-MM-DD in business timezone. */
  work_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  total_work_minutes: number;
  total_break_minutes: number;
  /** ISO timestamp of the currently-active break, if state is ON_BREAK. */
  active_break_started_at: string | null;
  status: AttendanceStatus | null;
}
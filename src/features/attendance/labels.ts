import type { AttendanceState, AttendanceStatus } from '@/types/attendance';

type BadgeVariant =
  | 'neutral'
  | 'muted'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'lime';

export interface StateDisplay {
  label: string;
  variant: BadgeVariant;
}

export function displayAttendanceState(state: AttendanceState): StateDisplay {
  switch (state) {
    case 'NOT_CHECKED_IN':
      return { label: 'Not checked in', variant: 'muted' };
    case 'CHECKED_IN':
      return { label: 'Working', variant: 'success' };
    case 'ON_BREAK':
      return { label: 'On break', variant: 'warning' };
    case 'BACK_FROM_BREAK':
      return { label: 'Working', variant: 'success' };
    case 'CHECKED_OUT':
      return { label: 'Checked out', variant: 'neutral' };
  }
}

export function displayAttendanceStatus(
  status: AttendanceStatus | null,
): StateDisplay | null {
  if (!status) return null;
  switch (status) {
    case 'on_time':
      return { label: 'On time', variant: 'success' };
    case 'late':
      return { label: 'Late', variant: 'warning' };
    case 'absent':
      return { label: 'Absent', variant: 'danger' };
  }
}

/** Whether the state represents the employee currently being at work. */
export function isAtWork(state: AttendanceState): boolean {
  return state === 'CHECKED_IN' || state === 'ON_BREAK' || state === 'BACK_FROM_BREAK';
}

/** Whether a clock-in action is currently permitted. */
export function canClockIn(state: AttendanceState): boolean {
  return state === 'NOT_CHECKED_IN';
}

/** Whether a clock-out action is currently permitted. */
export function canClockOut(state: AttendanceState): boolean {
  return state === 'CHECKED_IN' || state === 'BACK_FROM_BREAK';
}

/** Whether a start-break action is currently permitted. */
export function canStartBreak(state: AttendanceState): boolean {
  return state === 'CHECKED_IN' || state === 'BACK_FROM_BREAK';
}

/** Whether an end-break action is currently permitted. */
export function canEndBreak(state: AttendanceState): boolean {
  return state === 'ON_BREAK';
}
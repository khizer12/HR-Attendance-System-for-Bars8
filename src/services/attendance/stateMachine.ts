import type { AttendanceState } from '@/types/attendance';

/**
 * Attendance engine — pure state machine.
 *
 * NO side effects. NO timestamps. NO DB access.
 * Given a current state and an action, returns the next state or an error.
 *
 * This is the single source of truth for legal transitions.
 * The database RPC functions perform the same checks server-side for defense
 * in depth, but this module is what the frontend consults first.
 */

export type AttendanceAction =
  | 'clock_in'
  | 'start_break'
  | 'end_break'
  | 'clock_out';

export interface TransitionSuccess {
  ok: true;
  nextState: AttendanceState;
}

export interface TransitionFailure {
  ok: false;
  reason: string;
}

export type TransitionResult = TransitionSuccess | TransitionFailure;

/**
 * Allowed transitions, encoded as a lookup table.
 * Adding a new state or action requires updating this table — nothing else.
 *
 *   NOT_CHECKED_IN  --clock_in-->   CHECKED_IN
 *   CHECKED_IN      --start_break--> ON_BREAK
 *   CHECKED_IN      --clock_out-->  CHECKED_OUT
 *   ON_BREAK        --end_break-->  BACK_FROM_BREAK
 *   BACK_FROM_BREAK --start_break--> ON_BREAK
 *   BACK_FROM_BREAK --clock_out-->  CHECKED_OUT
 *   CHECKED_OUT     --(nothing)-->
 */
const ALLOWED: Record<AttendanceState, readonly AttendanceAction[]> = {
  NOT_CHECKED_IN: ['clock_in'],
  CHECKED_IN: ['start_break', 'clock_out'],
  ON_BREAK: ['end_break'],
  BACK_FROM_BREAK: ['start_break', 'clock_out'],
  CHECKED_OUT: [],
} as const;

const NEXT_STATE: Record<
  AttendanceState,
  Partial<Record<AttendanceAction, AttendanceState>>
> = {
  NOT_CHECKED_IN: { clock_in: 'CHECKED_IN' },
  CHECKED_IN: {
    start_break: 'ON_BREAK',
    clock_out: 'CHECKED_OUT',
  },
  ON_BREAK: { end_break: 'BACK_FROM_BREAK' },
  BACK_FROM_BREAK: {
    start_break: 'ON_BREAK',
    clock_out: 'CHECKED_OUT',
  },
  CHECKED_OUT: {},
};

/**
 * Attempt a transition. Returns a discriminated union so callers
 * are forced to handle failure.
 */
export function applyAction(
  state: AttendanceState,
  action: AttendanceAction,
): TransitionResult {
  if (!ALLOWED[state].includes(action)) {
    return {
      ok: false,
      reason: humanReason(state, action),
    };
  }

  const nextState = NEXT_STATE[state][action];
  if (!nextState) {
    // Defensive: ALLOWED and NEXT_STATE drifted out of sync.
    return {
      ok: false,
      reason: `Internal error: missing transition for ${state} + ${action}.`,
    };
  }

  return { ok: true, nextState };
}

function humanReason(state: AttendanceState, action: AttendanceAction): string {
  switch (`${state}:${action}`) {
    case 'NOT_CHECKED_IN:start_break':
      return 'You must clock in before starting a break.';
    case 'NOT_CHECKED_IN:end_break':
      return 'You have not started a break.';
    case 'NOT_CHECKED_IN:clock_out':
      return 'You are not clocked in.';
    case 'CHECKED_IN:clock_in':
      return 'You are already clocked in.';
    case 'CHECKED_IN:end_break':
      return 'You are not on a break.';
    case 'ON_BREAK:clock_in':
      return 'You are already clocked in.';
    case 'ON_BREAK:start_break':
      return 'You are already on a break.';
    case 'ON_BREAK:clock_out':
      return 'End your break before clocking out.';
    case 'BACK_FROM_BREAK:clock_in':
      return 'You are already clocked in.';
    case 'BACK_FROM_BREAK:end_break':
      return 'You are not on a break.';
    case 'CHECKED_OUT:clock_in':
      return 'You have already clocked out for today.';
    case 'CHECKED_OUT:start_break':
      return 'You have already clocked out for today.';
    case 'CHECKED_OUT:end_break':
      return 'You have already clocked out for today.';
    case 'CHECKED_OUT:clock_out':
      return 'You have already clocked out for today.';
    default:
      return `Cannot perform ${action} while in state ${state}.`;
  }
}

/**
 * Convenience: is the given action permitted from the given state?
 */
export function isActionAllowed(
  state: AttendanceState,
  action: AttendanceAction,
): boolean {
  return ALLOWED[state].includes(action);
}

/**
 * Timestamp validation — Rule 16 and 17.
 * Returns null if the interval is valid, or a reason string if not.
 */
/**
 * Timestamp validation — Rule 16 and 17.
 * Returns null if the interval is valid, or a reason string if not.
 */
export function validateInterval(
  startIso: string | null,
  endIso: string | null,
): string | null {
  if (startIso === null && endIso === null) return null;
  if (startIso === null) return 'End time exists without a start time.';

  const start = Date.parse(startIso);
  if (Number.isNaN(start)) return 'Start time is not a valid timestamp.';

  if (endIso === null) return null; // ongoing session is valid

  const end = Date.parse(endIso);
  if (Number.isNaN(end)) return 'End time is not a valid timestamp.';
  if (end < start) return 'End time cannot be earlier than start time.';
  return null;
}
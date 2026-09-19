import { describe, expect, it } from 'vitest';

import type { AttendanceState } from '@/types/attendance';
import {
  applyAction,
  isActionAllowed,
  validateInterval,
  type AttendanceAction,
} from '@/services/attendance/stateMachine';

const ALL_STATES: AttendanceState[] = [
  'NOT_CHECKED_IN',
  'CHECKED_IN',
  'ON_BREAK',
  'BACK_FROM_BREAK',
  'CHECKED_OUT',
];

const ALL_ACTIONS: AttendanceAction[] = [
  'clock_in',
  'start_break',
  'end_break',
  'clock_out',
];

describe('state machine — happy paths', () => {
  it('NOT_CHECKED_IN --clock_in--> CHECKED_IN', () => {
    const r = applyAction('NOT_CHECKED_IN', 'clock_in');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.nextState).toBe('CHECKED_IN');
  });

  it('CHECKED_IN --start_break--> ON_BREAK', () => {
    const r = applyAction('CHECKED_IN', 'start_break');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.nextState).toBe('ON_BREAK');
  });

  it('ON_BREAK --end_break--> BACK_FROM_BREAK', () => {
    const r = applyAction('ON_BREAK', 'end_break');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.nextState).toBe('BACK_FROM_BREAK');
  });

  it('CHECKED_IN --clock_out--> CHECKED_OUT', () => {
    const r = applyAction('CHECKED_IN', 'clock_out');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.nextState).toBe('CHECKED_OUT');
  });

  it('BACK_FROM_BREAK --start_break--> ON_BREAK (multiple breaks allowed)', () => {
    const r = applyAction('BACK_FROM_BREAK', 'start_break');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.nextState).toBe('ON_BREAK');
  });

  it('BACK_FROM_BREAK --clock_out--> CHECKED_OUT', () => {
    const r = applyAction('BACK_FROM_BREAK', 'clock_out');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.nextState).toBe('CHECKED_OUT');
  });
});

describe('state machine — forbidden transitions', () => {
  it('NOT_CHECKED_IN --start_break--> error', () => {
    const r = applyAction('NOT_CHECKED_IN', 'start_break');
    expect(r.ok).toBe(false);
  });

  it('NOT_CHECKED_IN --end_break--> error', () => {
    const r = applyAction('NOT_CHECKED_IN', 'end_break');
    expect(r.ok).toBe(false);
  });

  it('NOT_CHECKED_IN --clock_out--> error', () => {
    const r = applyAction('NOT_CHECKED_IN', 'clock_out');
    expect(r.ok).toBe(false);
  });

  it('CHECKED_IN --clock_in--> error (duplicate clock-in)', () => {
    const r = applyAction('CHECKED_IN', 'clock_in');
    expect(r.ok).toBe(false);
  });

  it('CHECKED_IN --end_break--> error', () => {
    const r = applyAction('CHECKED_IN', 'end_break');
    expect(r.ok).toBe(false);
  });

  it('ON_BREAK --clock_out--> error (must end break first)', () => {
    const r = applyAction('ON_BREAK', 'clock_out');
    expect(r.ok).toBe(false);
  });

  it('ON_BREAK --start_break--> error (already on break)', () => {
    const r = applyAction('ON_BREAK', 'start_break');
    expect(r.ok).toBe(false);
  });

  it('BACK_FROM_BREAK --end_break--> error (not on break)', () => {
    const r = applyAction('BACK_FROM_BREAK', 'end_break');
    expect(r.ok).toBe(false);
  });

  it('CHECKED_OUT --(every action)--> error', () => {
    for (const action of ALL_ACTIONS) {
      const r = applyAction('CHECKED_OUT', action);
      expect(r.ok).toBe(false);
    }
  });
});

describe('state machine — full matrix sanity', () => {
  it('every state+action pair returns a discriminated result', () => {
    for (const state of ALL_STATES) {
      for (const action of ALL_ACTIONS) {
        const r = applyAction(state, action);
        expect(typeof r.ok).toBe('boolean');
        if (!r.ok) expect(typeof r.reason).toBe('string');
        if (r.ok) expect(ALL_STATES).toContain(r.nextState);
      }
    }
  });

  it('isActionAllowed matches applyAction outcome', () => {
    for (const state of ALL_STATES) {
      for (const action of ALL_ACTIONS) {
        const allowed = isActionAllowed(state, action);
        const result = applyAction(state, action);
        expect(allowed).toBe(result.ok);
      }
    }
  });
});

describe('validateInterval', () => {
  it('accepts null/null', () => {
    expect(validateInterval(null, null)).toBeNull();
  });

  it('accepts ongoing (null end)', () => {
    expect(validateInterval('2026-09-19T10:00:00Z', null)).toBeNull();
  });

  it('accepts end > start', () => {
    expect(
      validateInterval('2026-09-19T10:00:00Z', '2026-09-19T11:00:00Z'),
    ).toBeNull();
  });

  it('accepts equal start and end', () => {
    expect(
      validateInterval('2026-09-19T10:00:00Z', '2026-09-19T10:00:00Z'),
    ).toBeNull();
  });

  it('rejects end < start', () => {
    expect(
      validateInterval('2026-09-19T11:00:00Z', '2026-09-19T10:00:00Z'),
    ).not.toBeNull();
  });

  it('rejects end without start', () => {
    expect(validateInterval(null, '2026-09-19T10:00:00Z')).not.toBeNull();
  });

  it('rejects invalid timestamps', () => {
    expect(validateInterval('not-a-date', null)).not.toBeNull();
    expect(
      validateInterval('2026-09-19T10:00:00Z', 'not-a-date'),
    ).not.toBeNull();
  });
});
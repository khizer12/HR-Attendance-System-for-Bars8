import type { AttendanceState } from '@/types/attendance';

export type AdminFilter =
  | 'all'
  | 'working'
  | 'on_break'
  | 'checked_out'
  | 'not_checked_in';

export function filterRows<T extends { state: AttendanceState }>(
  rows: T[],
  filter: AdminFilter,
): T[] {
  switch (filter) {
    case 'all':
      return rows;
    case 'working':
      return rows.filter(
        (r) => r.state === 'CHECKED_IN' || r.state === 'BACK_FROM_BREAK',
      );
    case 'on_break':
      return rows.filter((r) => r.state === 'ON_BREAK');
    case 'checked_out':
      return rows.filter((r) => r.state === 'CHECKED_OUT');
    case 'not_checked_in':
      return rows.filter((r) => r.state === 'NOT_CHECKED_IN');
  }
}

export function countByFilter<T extends { state: AttendanceState }>(
  rows: T[],
): Record<AdminFilter, number> {
  return {
    all: rows.length,
    working: rows.filter(
      (r) => r.state === 'CHECKED_IN' || r.state === 'BACK_FROM_BREAK',
    ).length,
    on_break: rows.filter((r) => r.state === 'ON_BREAK').length,
    checked_out: rows.filter((r) => r.state === 'CHECKED_OUT').length,
    not_checked_in: rows.filter((r) => r.state === 'NOT_CHECKED_IN').length,
  };
}
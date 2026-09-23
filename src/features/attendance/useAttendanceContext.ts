import { useContext } from 'react';

import { AttendanceContext } from '@/features/attendance/AttendanceContext';

/**
 * Consume the shared attendance state. Must be used inside
 * `<AttendanceProvider>`.
 *
 * Prefer this over `useAttendance()` in components that live under the
 * provider — it reuses the shared fetches instead of starting new ones.
 */
export function useAttendanceContext() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error(
      'useAttendanceContext must be used inside <AttendanceProvider>. ' +
        'Wrap the protected routes in <AttendanceProvider>.',
    );
  }
  return ctx;
}
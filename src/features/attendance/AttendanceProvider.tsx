import type { ReactNode } from 'react';

import { AttendanceContext } from '@/features/attendance/AttendanceContext';
import { useAttendance } from '@/features/attendance/useAttendance';

interface AttendanceProviderProps {
  children: ReactNode;
}

/**
 * Provides a single shared instance of `useAttendance()` to the subtree.
 *
 * Why: without this, every component that calls useAttendance() performs
 * its own fetches of `get_today_summary`, `attendance_records`, and
 * `break_records`. On the dashboard that meant two identical round-trips
 * per page load.
 *
 * Only mounted inside the protected area (below ProtectedRoute), so it
 * assumes an authenticated user.
 */
export function AttendanceProvider({ children }: AttendanceProviderProps) {
  const value = useAttendance();
  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}
import { createContext } from 'react';

import type { UseAttendanceResult } from '@/features/attendance/useAttendance';

export const AttendanceContext = createContext<UseAttendanceResult | undefined>(
  undefined,
);
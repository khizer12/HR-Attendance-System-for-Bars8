import { useEffect, useState } from 'react';

import { fetchVerificationsForAttendance } from '@/features/location/api';
import type { LocationVerification } from '@/types/location';

export interface UseVerificationsForAttendanceResult {
  rows: LocationVerification[];
  loading: boolean;
  error: string | null;
}

export function useVerificationsForAttendance(
  attendanceId: string | null,
): UseVerificationsForAttendanceResult {
  const [rows, setRows] = useState<LocationVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!attendanceId) {
        if (cancelled) return;
        setRows([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);

      try {
        const next = await fetchVerificationsForAttendance(attendanceId);
        if (cancelled) return;
        setRows(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load verifications.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attendanceId]);

  return { rows, loading, error };
}
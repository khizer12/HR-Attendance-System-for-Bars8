import { useCallback, useEffect, useState } from 'react';

import { fetchActiveOfficeLocation } from '@/features/location/api';
import type { OfficeLocation } from '@/types/location';

export interface UseOfficeLocationResult {
  office: OfficeLocation | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetch the currently-active office location.
 *
 * `null` office means none is configured. Geofenced clock-in will then be
 * refused by the server. The Settings UI (block 11C) is where a super admin
 * configures one.
 */
export function useOfficeLocation(): UseOfficeLocationResult {
  const [office, setOffice] = useState<OfficeLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await fetchActiveOfficeLocation();
      setOffice(next);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load office location.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await fetchActiveOfficeLocation();
        if (cancelled) return;
        setOffice(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load office location.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { office, loading, error, refresh: load };
}
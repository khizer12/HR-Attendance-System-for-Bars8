import { useCallback, useEffect, useState } from 'react';

import { listOfficeLocations } from '@/features/location';
import type { OfficeLocation } from '@/types/location';

export interface UseOfficeLocationsResult {
  offices: OfficeLocation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOfficeLocations(): UseOfficeLocationsResult {
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listOfficeLocations();
      setOffices(next);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load office locations.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await listOfficeLocations();
        if (cancelled) return;
        setOffices(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load office locations.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { offices, loading, error, refresh: load };
}
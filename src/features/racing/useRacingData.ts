import { useEffect, useState } from 'react';

import { listRacingCars, listRacingTracks } from '@/features/racing/api';
import type { RacingCar, RacingTrack } from '@/types/racing';

export interface UseRacingDataResult {
  cars: RacingCar[];
  tracks: RacingTrack[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the reference tables (cars + tracks). These rarely change, so
 * a single fetch per mount is fine.
 */
export function useRacingData(): UseRacingDataResult {
  const [cars, setCars] = useState<RacingCar[]>([]);
  const [tracks, setTracks] = useState<RacingTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [nextCars, nextTracks] = await Promise.all([
          listRacingCars(),
          listRacingTracks(),
        ]);
        if (cancelled) return;
        setCars(nextCars);
        setTracks(nextTracks);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load racing data.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { cars, tracks, loading, error };
}
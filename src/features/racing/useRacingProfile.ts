import { useCallback, useEffect, useState } from 'react';

import {
  getMyRacingProfile,
  upsertMyRacingProfile,
  type UpsertRacingProfileInput,
} from '@/features/racing/api';
import type { UserRacingProfile } from '@/types/racing';

export interface UseRacingProfileResult {
  profile: UserRacingProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  save: (input: UpsertRacingProfileInput) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRacingProfile(): UseRacingProfileResult {
  const [profile, setProfile] = useState<UserRacingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await getMyRacingProfile();
      setProfile(next);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load racing profile.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await getMyRacingProfile();
        if (cancelled) return;
        setProfile(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load racing profile.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (input: UpsertRacingProfileInput) => {
    setSaving(true);
    setError(null);
    try {
      const next = await upsertMyRacingProfile(input);
      setProfile(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, loading, saving, error, save, refresh: load };
}
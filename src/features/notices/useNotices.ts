import { useCallback, useEffect, useState } from 'react';

import { listNotices } from '@/features/notices/api';
import type { NoticeWithAuthor } from '@/types/notice';

export interface UseNoticesResult {
  rows: NoticeWithAuthor[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNotices(): UseNoticesResult {
  const [rows, setRows] = useState<NoticeWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listNotices();
      setRows(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await listNotices();
        if (cancelled) return;
        setRows(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load notices.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, loading, error, refresh: load };
}
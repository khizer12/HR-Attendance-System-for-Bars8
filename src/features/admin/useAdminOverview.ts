import { useCallback, useEffect, useState } from 'react';

import { fetchAdminOverview, type AdminOverviewRow } from '@/features/admin/api';

const POLL_INTERVAL_MS = 30_000;

export interface UseAdminOverviewResult {
  rows: AdminOverviewRow[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useAdminOverview(): UseAdminOverviewResult {
  const [rows, setRows] = useState<AdminOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await fetchAdminOverview();
      setRows(next);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load — inline so React Compiler can verify no synchronous setState.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await fetchAdminOverview();
        if (cancelled) return;
        setRows(next);
        setError(null);
        setLastUpdated(new Date());
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Background polling. Stops when the tab is hidden (document.visibilityState).
  useEffect(() => {
    let cancelled = false;

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (cancelled) return;
      void fetchAdminOverview()
        .then((next) => {
          if (cancelled) return;
          setRows(next);
          setError(null);
          setLastUpdated(new Date());
        })
        .catch(() => {
          // Polling errors are swallowed — the visible error from the initial
          // load or a manual refresh is what the user sees.
        });
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return { rows, loading, error, lastUpdated, refresh: load };
}
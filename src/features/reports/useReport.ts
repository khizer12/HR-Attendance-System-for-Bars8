import { useCallback, useState } from 'react';

import {
  fetchReport,
  type ReportFilters,
  type ReportRow,
} from '@/features/reports/api';

export interface UseReportResult {
  rows: ReportRow[];
  loading: boolean;
  error: string | null;
  /** True after the first successful load. */
  loaded: boolean;
  run: (filters: ReportFilters) => Promise<void>;
  clear: () => void;
}

/**
 * Reports are user-triggered (not auto-loaded on mount) so we
 * don't fetch data the admin hasn't asked for yet.
 */
export function useReport(): UseReportResult {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const run = useCallback(async (filters: ReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchReport(filters);
      setRows(next);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run report.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setRows([]);
    setError(null);
    setLoaded(false);
  }, []);

  return { rows, loading, error, loaded, run, clear };
}
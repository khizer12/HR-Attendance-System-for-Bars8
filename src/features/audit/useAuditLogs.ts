import { useEffect, useState } from 'react';

import {
  fetchAuditLogs,
  type AuditLogFilters,
  type AuditLogRow,
} from '@/features/audit/api';

export interface UseAuditLogsResult {
  rows: AuditLogRow[];
  loading: boolean;
  error: string | null;
}

export function useAuditLogs(filters: AuditLogFilters): UseAuditLogsResult {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stringified deps so the effect re-runs when filters change, without
  // having to memoise the object at call sites.
  const key = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const next = await fetchAuditLogs(filters);
        if (cancelled) return;
        setRows(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load audit logs.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { rows, loading, error };
}
import { useCallback, useEffect, useState } from 'react';

import {
  getActiveSalary,
  listSalaryHistory,
} from '@/features/payroll/api';
import type { SalaryStructure } from '@/types/payroll';

export interface UseEmployeeSalaryResult {
  active: SalaryStructure | null;
  history: SalaryStructure[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useEmployeeSalary(
  employeeId: string | undefined,
): UseEmployeeSalaryResult {
  const [active, setActive] = useState<SalaryStructure | null>(null);
  const [history, setHistory] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employeeId) {
      setActive(null);
      setHistory([]);
      setLoading(false);
      return;
    }
    try {
      const [a, h] = await Promise.all([
        getActiveSalary(employeeId),
        listSalaryHistory(employeeId),
      ]);
      setActive(a);
      setHistory(h);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load salary.');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!employeeId) {
        if (!cancelled) {
          setActive(null);
          setHistory([]);
          setLoading(false);
        }
        return;
      }
      try {
        const [a, h] = await Promise.all([
          getActiveSalary(employeeId),
          listSalaryHistory(employeeId),
        ]);
        if (cancelled) return;
        setActive(a);
        setHistory(h);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load salary.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  return { active, history, loading, error, refresh: load };
}
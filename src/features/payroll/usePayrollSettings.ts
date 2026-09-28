import { useCallback, useEffect, useState } from 'react';

import {
  getPayrollSettings,
  listBonusTiers,
} from '@/features/payroll/api';
import type { BonusTier, PayrollSettings } from '@/types/payroll';

export interface UsePayrollSettingsResult {
  settings: PayrollSettings | null;
  tiers: BonusTier[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePayrollSettings(): UsePayrollSettingsResult {
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [tiers, setTiers] = useState<BonusTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        getPayrollSettings(),
        listBonusTiers(),
      ]);
      setSettings(s);
      setTiers(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, t] = await Promise.all([
          getPayrollSettings(),
          listBonusTiers(),
        ]);
        if (cancelled) return;
        setSettings(s);
        setTiers(t);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load settings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, tiers, loading, error, refresh: load };
}
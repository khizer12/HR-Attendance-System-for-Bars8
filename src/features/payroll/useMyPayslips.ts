import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { PayrollItem } from '@/types/payroll';

export interface PayslipWithRun extends PayrollItem {
  run_month: string;
}

export interface UseMyPayslipsResult {
  rows: PayslipWithRun[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetch the current user's published payslips.
 * RLS policy `payroll_items_select_own_published` enforces:
 *   - employee_id = auth.uid()
 *   - the run is 'published'
 */
export function useMyPayslips(): UseMyPayslipsResult {
  const [rows, setRows] = useState<PayslipWithRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('payroll_items')
        .select(
          `
          id, run_id, employee_id, currency,
          base_monthly_snapshot, working_days_snapshot,
          present_days, paid_leave_days, unpaid_leave_days, absent_days, late_days,
          base_earned, bonus_amount, bonus_note,
          absence_deduction, absence_note, late_deduction,
          late_waived, late_waived_by, late_waived_at, late_waive_reason,
          manual_addition, manual_deduction, manual_note,
          net_pay, calculated_at, created_at, updated_at,
          run:payroll_runs!inner ( month, status )
        `,
        )
        .eq('employee_id', uid)
        .eq('run.status', 'published')
        .order('created_at', { ascending: false });

      if (fetchError) throw new Error(fetchError.message);

      type Raw = PayrollItem & {
        run: { month: string; status: string } | null;
      };

      const mapped = ((data ?? []) as unknown as Raw[])
        .filter((r) => r.run !== null)
        .map<PayslipWithRun>((r) => ({
          ...r,
          run_month: r.run!.month,
        }));

      setRows(mapped);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payslips.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) {
          if (!cancelled) {
            setRows([]);
            setLoading(false);
          }
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('payroll_items')
          .select(
            `
            id, run_id, employee_id, currency,
            base_monthly_snapshot, working_days_snapshot,
            present_days, paid_leave_days, unpaid_leave_days, absent_days, late_days,
            base_earned, bonus_amount, bonus_note,
            absence_deduction, absence_note, late_deduction,
            late_waived, late_waived_by, late_waived_at, late_waive_reason,
            manual_addition, manual_deduction, manual_note,
            net_pay, calculated_at, created_at, updated_at,
            run:payroll_runs!inner ( month, status )
          `,
          )
          .eq('employee_id', uid)
          .eq('run.status', 'published')
          .order('created_at', { ascending: false });

        if (fetchError) throw new Error(fetchError.message);

        type Raw = PayrollItem & {
          run: { month: string; status: string } | null;
        };

        const mapped = ((data ?? []) as unknown as Raw[])
          .filter((r) => r.run !== null)
          .map<PayslipWithRun>((r) => ({
            ...r,
            run_month: r.run!.month,
          }));

        if (cancelled) return;
        setRows(mapped);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load payslips.',
        );
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
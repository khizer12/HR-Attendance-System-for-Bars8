import { supabase } from '@/lib/supabase';
import type { PayrollItem, PayrollRun, PayrollRunStatus } from '@/types/payroll';

const RUN_COLUMNS = `
  id, month, status, notes,
  absence_mode, absence_flat_amount, late_mode, late_flat_amount,
  created_by, created_at, submitted_by, submitted_at,
  approved_by, approved_at, published_by, published_at
`;

const ITEM_COLUMNS = `
  id, run_id, employee_id, currency,
  base_monthly_snapshot, working_days_snapshot,
  present_days, paid_leave_days, unpaid_leave_days, absent_days, late_days,
  base_earned, bonus_amount, bonus_note,
  absence_deduction, absence_note, late_deduction,
  late_waived, late_waived_by, late_waived_at, late_waive_reason,
  manual_addition, manual_deduction, manual_note,
  net_pay, calculated_at, created_at, updated_at
`;

export interface CreateRunInput {
  month: string; // YYYY-MM-01
  notes?: string | null;
  absence_mode?: 'flat' | 'auto' | null;
  absence_flat_amount?: number | null;
  late_mode?: 'flat' | 'waived' | null;
  late_flat_amount?: number | null;
}

export async function listPayrollRuns(): Promise<PayrollRun[]> {
  const { data, error } = await supabase
    .from('payroll_runs')
    .select(RUN_COLUMNS)
    .order('month', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PayrollRun[];
}

export async function getPayrollRun(id: string): Promise<PayrollRun | null> {
  const { data, error } = await supabase
    .from('payroll_runs')
    .select(RUN_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PayrollRun | null) ?? null;
}

export async function createPayrollRun(
  input: CreateRunInput,
): Promise<PayrollRun> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  const { data, error } = await supabase
    .from('payroll_runs')
    .insert({
      month: input.month,
      notes: input.notes?.trim() || null,
      absence_mode: input.absence_mode ?? null,
      absence_flat_amount: input.absence_flat_amount ?? null,
      late_mode: input.late_mode ?? null,
      late_flat_amount: input.late_flat_amount ?? null,
      created_by: uid,
    })
    .select(RUN_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as PayrollRun;
}

export async function calculateRun(runId: string): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_payroll_run', {
    p_run_id: runId,
  });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

export async function listRunItems(runId: string): Promise<PayrollItem[]> {
  const { data, error } = await supabase
    .from('payroll_items')
    .select(ITEM_COLUMNS)
    .eq('run_id', runId)
    .order('employee_id');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PayrollItem[];
}

export interface UpdateItemInput {
  bonus_amount?: number;
  bonus_note?: string | null;
  absence_deduction?: number;
  absence_note?: string | null;
  late_deduction?: number;
  late_waived?: boolean;
  late_waive_reason?: string | null;
  manual_addition?: number;
  manual_deduction?: number;
  manual_note?: string | null;
  net_pay?: number;
}

export async function updatePayrollItem(
  itemId: string,
  patch: UpdateItemInput,
): Promise<void> {
  const { error } = await supabase
    .from('payroll_items')
    .update(patch)
    .eq('id', itemId);
  if (error) throw new Error(error.message);
}

/** Change a run's status (draft → pending_approval → approved → published). */
export async function updateRunStatus(
  runId: string,
  next: PayrollRunStatus,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: next };

  if (next === 'pending_approval') {
    patch.submitted_by = uid;
    patch.submitted_at = now;
  } else if (next === 'approved') {
    patch.approved_by = uid;
    patch.approved_at = now;
  } else if (next === 'published') {
    patch.published_by = uid;
    patch.published_at = now;
  }

  const { error } = await supabase
    .from('payroll_runs')
    .update(patch)
    .eq('id', runId);
  if (error) throw new Error(error.message);
}

export async function deletePayrollRun(runId: string): Promise<void> {
  const { error } = await supabase.from('payroll_runs').delete().eq('id', runId);
  if (error) throw new Error(error.message);
}
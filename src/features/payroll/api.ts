import { supabase } from '@/lib/supabase';
import type {
  BonusTier,
  PayrollSettings,
  SalaryStructure,
  SalaryStructureInput,
} from '@/types/payroll';

const SALARY_COLUMNS =
  'id, employee_id, currency, base_monthly, effective_from, effective_to, notes, created_by, created_at, updated_at';

const BONUS_TIER_COLUMNS =
  'id, from_usd, to_usd, bonus_percent, sort_order, active, created_at, updated_at';

const PAYROLL_SETTINGS_COLUMNS =
  'id, default_absence_mode, default_absence_flat_amount, default_late_mode, default_late_flat_amount, default_currency, updated_at, updated_by';

/**
 * Fetch the currently active salary structure for an employee.
 * `effective_to is null` means it's the live row.
 */
export async function getActiveSalary(
  employeeId: string,
): Promise<SalaryStructure | null> {
  const { data, error } = await supabase
    .from('salary_structures')
    .select(SALARY_COLUMNS)
    .eq('employee_id', employeeId)
    .is('effective_to', null)
    .maybeSingle<SalaryStructure>();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Fetch full salary history for an employee, newest first.
 */
export async function listSalaryHistory(
  employeeId: string,
): Promise<SalaryStructure[]> {
  const { data, error } = await supabase
    .from('salary_structures')
    .select(SALARY_COLUMNS)
    .eq('employee_id', employeeId)
    .order('effective_from', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SalaryStructure[];
}

/**
 * Set or replace the active salary structure for an employee.
 * Closes the current active row (effective_to = today - 1) and
 * inserts a new one starting today. Atomic in a single transaction
 * if the DB supports it — for now, two sequential calls.
 *
 * The partial unique index (one active per employee) prevents races.
 */
export async function setSalary(
  employeeId: string,
  input: SalaryStructureInput,
): Promise<SalaryStructure> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  // Close the current active row, if any.
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const { error: closeError } = await supabase
    .from('salary_structures')
    .update({ effective_to: yesterday })
    .eq('employee_id', employeeId)
    .is('effective_to', null);
  if (closeError) throw new Error(closeError.message);

  // Insert the new row.
  const { data, error } = await supabase
    .from('salary_structures')
    .insert({
      employee_id: employeeId,
      currency: input.currency,
      base_monthly: input.base_monthly,
      effective_from: input.effective_from ?? today,
      notes: input.notes?.trim() || null,
      created_by: uid,
    })
    .select(SALARY_COLUMNS)
    .single<SalaryStructure>();
  if (error) throw new Error(error.message);
  return data;
}

export async function listBonusTiers(): Promise<BonusTier[]> {
  const { data, error } = await supabase
    .from('bonus_tiers')
    .select(BONUS_TIER_COLUMNS)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BonusTier[];
}

export async function getPayrollSettings(): Promise<PayrollSettings | null> {
  const { data, error } = await supabase
    .from('payroll_settings')
    .select(PAYROLL_SETTINGS_COLUMNS)
    .eq('id', 1)
    .maybeSingle<PayrollSettings>();
  if (error) throw new Error(error.message);
  return data;
}

export interface UpdatePayrollSettingsInput {
  default_absence_mode?: 'flat' | 'auto';
  default_absence_flat_amount?: number;
  default_late_mode?: 'flat' | 'waived';
  default_late_flat_amount?: number;
  default_currency?: 'AED' | 'USDT';
}

export async function updatePayrollSettings(
  input: UpdatePayrollSettingsInput,
): Promise<PayrollSettings> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  const { data, error } = await supabase
    .from('payroll_settings')
    .update({ ...input, updated_by: uid })
    .eq('id', 1)
    .select(PAYROLL_SETTINGS_COLUMNS)
    .single<PayrollSettings>();
  if (error) throw new Error(error.message);
  return data;
}
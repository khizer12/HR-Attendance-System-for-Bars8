export type PayrollCurrency = 'AED' | 'USDT';
export type PayrollRunStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'published'
  | 'cancelled';

export interface SalaryStructure {
  id: string;
  employee_id: string;
  currency: PayrollCurrency;
  base_monthly: number;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryStructureInput {
  currency: PayrollCurrency;
  base_monthly: number;
  effective_from?: string;
  notes?: string | null;
}

export interface BonusTier {
  id: string;
  from_usd: number;
  to_usd: number | null;
  bonus_percent: number;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollSettings {
  id: number;
  default_absence_mode: 'flat' | 'auto';
  default_absence_flat_amount: number;
  default_late_mode: 'flat' | 'waived';
  default_late_flat_amount: number;
  default_currency: PayrollCurrency;
  updated_at: string;
  updated_by: string | null;
}

export interface PayrollRun {
  id: string;
  month: string;
  status: PayrollRunStatus;
  notes: string | null;
  absence_mode: 'flat' | 'auto' | null;
  absence_flat_amount: number | null;
  late_mode: 'flat' | 'waived' | null;
  late_flat_amount: number | null;
  created_by: string;
  created_at: string;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_by: string | null;
  published_at: string | null;
}

export interface PayrollItem {
  id: string;
  run_id: string;
  employee_id: string;
  currency: PayrollCurrency;
  base_monthly_snapshot: number;
  working_days_snapshot: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  absent_days: number;
  late_days: number;
  base_earned: number;
  bonus_amount: number;
  bonus_note: string | null;
  absence_deduction: number;
  absence_note: string | null;
  late_deduction: number;
  late_waived: boolean;
  late_waived_by: string | null;
  late_waived_at: string | null;
  late_waive_reason: string | null;
  manual_addition: number;
  manual_deduction: number;
  manual_note: string | null;
  net_pay: number;
  calculated_at: string | null;
  created_at: string;
  updated_at: string;
}
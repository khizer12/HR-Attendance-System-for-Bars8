import { supabase } from '@/lib/supabase';

/** One row from `report_attendance()`. */
export interface ReportRow {
  employee_id: string;
  email: string;
  full_name: string;
  department: string | null;
  /** YYYY-MM-DD */
  work_date: string;
  /** 'on_time' | 'late' | 'absent' */
  status: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  total_work_minutes: number | null;
  total_break_minutes: number | null;
  late_minutes: number;
}

export type ReportStatusFilter = 'on_time' | 'late' | 'absent' | null;

export interface ReportFilters {
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  /** null = all employees */
  employeeId: string | null;
  /** null = all statuses */
  status: ReportStatusFilter;
}

export async function fetchReport(filters: ReportFilters): Promise<ReportRow[]> {
  const { data, error } = await supabase.rpc('report_attendance', {
    p_start_date: filters.startDate,
    p_end_date: filters.endDate,
    p_employee_id: filters.employeeId,
    p_status: filters.status,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as ReportRow[];
}
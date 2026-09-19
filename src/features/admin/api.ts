import { supabase } from '@/lib/supabase';
import type { AttendanceState, AttendanceStatus } from '@/types/attendance';
import type { Role } from '@/types/auth';

export interface AdminOverviewRow {
  employee_id: string;
  email: string;
  full_name: string;
  role: Role;
  department: string | null;
  state: AttendanceState;
  attendance_id: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
  total_work_minutes: number | null;
  total_break_minutes: number | null;
  active_break_started_at: string | null;
  late_minutes: number | null;
  attendance_status: AttendanceStatus | null;
}

export async function fetchAdminOverview(): Promise<AdminOverviewRow[]> {
  const { data, error } = await supabase.rpc('admin_today_overview');
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminOverviewRow[];
}
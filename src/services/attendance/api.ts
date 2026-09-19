import { supabase } from '@/lib/supabase';
import type { AttendanceRecord, AttendanceState, AttendanceStatus } from '@/types/attendance';

/**
 * Thin wrappers over Supabase RPCs and reads.
 * No business logic here — the RPCs own that. This file only
 * normalizes return shapes and error messages.
 */

export interface TodaySummaryRow {
  state: AttendanceState;
  attendance_id: string | null;
  work_date: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
  total_work_minutes: number | null;
  total_break_minutes: number | null;
  active_break_id: string | null;
  active_break_started_at: string | null;
  status: AttendanceStatus | null;
  late_minutes: number | null;
}

const EMPTY_SUMMARY: TodaySummaryRow = {
  state: 'NOT_CHECKED_IN',
  attendance_id: null,
  work_date: null,
  clock_in_at: null,
  clock_out_at: null,
  total_work_minutes: null,
  total_break_minutes: null,
  active_break_id: null,
  active_break_started_at: null,
  status: null,
  late_minutes: null,
};

export async function fetchTodaySummary(): Promise<TodaySummaryRow> {
  const { data, error } = await supabase.rpc('get_today_summary');
  if (error) throw new Error(error.message);

  // The RPC returns a table; take the first (only) row.
  const row = Array.isArray(data) ? (data[0] as TodaySummaryRow | undefined) : undefined;
  return row ?? EMPTY_SUMMARY;
}

export async function fetchAttendanceHistory(limit = 30): Promise<AttendanceRecord[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', uid)
    .order('work_date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as AttendanceRecord[];
}

export async function rpcClockIn(): Promise<void> {
  const { error } = await supabase.rpc('clock_in');
  if (error) throw new Error(error.message);
}

export async function rpcStartBreak(): Promise<void> {
  const { error } = await supabase.rpc('start_break');
  if (error) throw new Error(error.message);
}

export async function rpcEndBreak(): Promise<void> {
  const { error } = await supabase.rpc('end_break');
  if (error) throw new Error(error.message);
}

export async function rpcClockOut(): Promise<void> {
  const { error } = await supabase.rpc('clock_out');
  if (error) throw new Error(error.message);
}
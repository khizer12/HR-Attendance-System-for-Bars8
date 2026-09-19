import { supabase } from '@/lib/supabase';

export interface Schedule {
  id: string;
  name: string;
  /** Postgres `time` — format "HH:MM:SS" (e.g. "10:30:00"). */
  start_time: string;
  end_time: string;
  /** Postgres DOW: 0=Sun, 1=Mon, ..., 6=Sat. */
  working_days: number[];
  grace_period_minutes: number;
  break_required: boolean;
  min_break_minutes: number | null;
  max_break_minutes: number | null;
  location_required: boolean;
  verification_interval_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleInput {
  name: string;
  start_time: string;
  end_time: string;
  working_days: number[];
  grace_period_minutes: number;
  break_required?: boolean;
  min_break_minutes?: number | null;
  max_break_minutes?: number | null;
  location_required?: boolean;
  verification_interval_minutes?: number;
  active?: boolean;
}

const SCHEDULE_COLUMNS =
  'id, name, start_time, end_time, working_days, grace_period_minutes, break_required, min_break_minutes, max_break_minutes, location_required, verification_interval_minutes, active, created_at, updated_at';

export async function listSchedules(): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select(SCHEDULE_COLUMNS)
    .order('active', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Schedule[];
}

export async function getScheduleById(id: string): Promise<Schedule | null> {
  const { data, error } = await supabase
    .from('schedules')
    .select(SCHEDULE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Schedule | null) ?? null;
}

export async function createSchedule(input: ScheduleInput): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .insert(input)
    .select(SCHEDULE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as Schedule;
}

export async function updateSchedule(
  id: string,
  patch: Partial<ScheduleInput>,
): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .update(patch)
    .eq('id', id)
    .select(SCHEDULE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as Schedule;
}

/**
 * Assign a schedule to an employee. Pass `null` to unassign.
 * Only super_admins can perform this (enforced by RLS on `profiles`).
 */
export async function assignScheduleToEmployee(
  employeeId: string,
  scheduleId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ schedule_id: scheduleId })
    .eq('id', employeeId);

  if (error) throw new Error(error.message);
}
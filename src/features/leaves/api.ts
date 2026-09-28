import { supabase } from '@/lib/supabase';
import type {
  CreateLeaveInput,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestWithMeta,
  LeaveType,
} from '@/types/leave';

const LEAVE_TYPE_COLUMNS =
  'id, name, description, is_paid, requires_approval, max_days_per_year, color, active, created_at, updated_at';

const LEAVE_REQUEST_COLUMNS = `
  id, employee_id, leave_type_id, start_date, end_date, reason,
  status, decided_by, decided_at, decision_note, created_at, updated_at,
  leave_type:leave_types!leave_requests_leave_type_id_fkey ( name, color ),
  employee:profiles!leave_requests_employee_id_fkey ( full_name, email )
`;

/** List active leave types. Readable by all authenticated users. */
export async function listLeaveTypes(): Promise<LeaveType[]> {
  const { data, error } = await supabase
    .from('leave_types')
    .select(LEAVE_TYPE_COLUMNS)
    .eq('active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaveType[];
}

/** Fetch the current user's own leave requests. */
export async function listMyLeaveRequests(): Promise<LeaveRequestWithMeta[]> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return [];

  const { data, error } = await supabase
    .from('leave_requests')
    .select(LEAVE_REQUEST_COLUMNS)
    .eq('employee_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return flatten(data);
}

/**
 * Admin: fetch all leave requests for employees the caller can see.
 * RLS handles scoping (super_admin sees all, sub_admin sees managed
 * departments).
 */
export async function listAllLeaveRequests(
  statusFilter?: 'pending' | 'approved' | 'rejected' | 'cancelled',
): Promise<LeaveRequestWithMeta[]> {
  let query = supabase
    .from('leave_requests')
    .select(LEAVE_REQUEST_COLUMNS)
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return flatten(data);
}

type RawRow = LeaveRequest & {
  leave_type: { name: string; color: string } | null;
  employee: { full_name: string; email: string } | null;
};

function flatten(rows: unknown): LeaveRequestWithMeta[] {
  return ((rows ?? []) as RawRow[]).map((r) => ({
    id: r.id,
    employee_id: r.employee_id,
    leave_type_id: r.leave_type_id,
    start_date: r.start_date,
    end_date: r.end_date,
    reason: r.reason,
    status: r.status,
    decided_by: r.decided_by,
    decided_at: r.decided_at,
    decision_note: r.decision_note,
    created_at: r.created_at,
    updated_at: r.updated_at,
    leave_type_name: r.leave_type?.name ?? 'Unknown',
    leave_type_color: r.leave_type?.color ?? '#929797',
    employee_full_name: r.employee?.full_name ?? 'Former employee',
    employee_email: r.employee?.email ?? '',
  }));
}

export async function createLeaveRequest(
  input: CreateLeaveInput,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  const { error } = await supabase.from('leave_requests').insert({
    employee_id: uid,
    leave_type_id: input.leave_type_id,
    start_date: input.start_date,
    end_date: input.end_date,
    reason: input.reason.trim(),
    status: 'pending',
  });

  if (error) throw new Error(error.message);
}

export async function cancelLeaveRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export interface DecideLeaveInput {
  id: string;
  decision: 'approved' | 'rejected';
  note: string | null;
}

export async function decideLeaveRequest(
  input: DecideLeaveInput,
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: input.decision,
      decided_by: uid,
      decided_at: new Date().toISOString(),
      decision_note: input.note?.trim() || null,
    })
    .eq('id', input.id);
  if (error) throw new Error(error.message);
}

/**
 * Compute the current user's leave balance for the current calendar
 * year. Days are computed as (end_date - start_date + 1) for every
 * approved request whose start_date is in the current year.
 *
 * Holidays and weekends are NOT excluded — a request for Mon-Fri uses
 * 5 days. If you want working-day-only counting, we can adjust later.
 */
export async function fetchMyLeaveBalances(): Promise<LeaveBalance[]> {
  const year = new Date().getFullYear();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const [typesRes, reqRes] = await Promise.all([
    supabase
      .from('leave_types')
      .select('id, name, color, max_days_per_year')
      .eq('active', true)
      .order('name'),
    supabase
      .from('leave_requests')
      .select('leave_type_id, start_date, end_date, status')
      .eq('status', 'approved')
      .gte('start_date', from)
      .lte('start_date', to),
  ]);

  if (typesRes.error) throw new Error(typesRes.error.message);
  if (reqRes.error) throw new Error(reqRes.error.message);

  const used = new Map<string, number>();
  for (const r of reqRes.data ?? []) {
    const days =
      Math.floor(
        (new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) /
          86_400_000,
      ) + 1;
    used.set(r.leave_type_id, (used.get(r.leave_type_id) ?? 0) + days);
  }

  return (typesRes.data ?? []).map((t) => {
    const u = used.get(t.id) ?? 0;
    return {
      leave_type_id: t.id,
      leave_type_name: t.name,
      leave_type_color: t.color,
      max_days_per_year: t.max_days_per_year,
      used_days: u,
      remaining_days: t.max_days_per_year === null ? null : t.max_days_per_year - u,
    };
  });
}
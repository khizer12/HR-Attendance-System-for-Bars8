export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  is_paid: boolean;
  requires_approval: boolean;
  max_days_per_year: number | null;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestWithMeta extends LeaveRequest {
  leave_type_name: string;
  leave_type_color: string;
  employee_full_name: string;
  employee_email: string;
}

export interface LeaveBalance {
  leave_type_id: string;
  leave_type_name: string;
  leave_type_color: string;
  max_days_per_year: number | null;
  used_days: number;
  remaining_days: number | null; // null when max is null (unlimited)
}

export interface CreateLeaveInput {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}
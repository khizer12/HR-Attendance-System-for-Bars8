import { supabase } from '@/lib/supabase';
import type {
  OfficeLocation,
  VerificationKind,
  VerificationStatus,
} from '@/types/location';
import type { LocationVerification } from '@/types/location';

/**
 * Thin wrappers over the location tables and the
 * `record_location_verification` RPC.
 *
 * No business logic here. Distances, geofence decisions, and the
 * append-only audit trail are all enforced server-side.
 */

const OFFICE_COLUMNS =
  'id, name, latitude, longitude, radius_meters, is_active, created_at, updated_at';

/**
 * Fetch the currently-active office, or null when none is configured.
 * A partial unique index guarantees at most one active row, so `.maybeSingle()`
 * is safe.
 */
export async function fetchActiveOfficeLocation(): Promise<OfficeLocation | null> {
  const { data, error } = await supabase
    .from('office_locations')
    .select(OFFICE_COLUMNS)
    .eq('is_active', true)
    .maybeSingle<OfficeLocation>();

  if (error) throw new Error(error.message);
  return data ?? null;
}

/** Every office location, active first, then alphabetical. */
export async function listOfficeLocations(): Promise<OfficeLocation[]> {
  const { data, error } = await supabase
    .from('office_locations')
    .select(OFFICE_COLUMNS)
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as OfficeLocation[];
}

export interface RecordVerificationInput {
  attendanceId: string;
  kind: Extract<VerificationKind, 'periodic' | 'clock_out' | 'manual'>;
  status: VerificationStatus;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
}

/**
 * Persist one location verification row via RPC.
 *
 * The RPC:
 *   - verifies the caller owns the attendance row,
 *   - recomputes distance server-side (never trusts client math),
 *   - returns the new row's id.
 *
 * It never mutates `attendance_records`. This is the Rule 20 / Rule 21
 * guarantee: failures are recorded, attendance is preserved.
 */
export async function recordLocationVerification(
  input: RecordVerificationInput,
): Promise<string> {
  const { data, error } = await supabase.rpc('record_location_verification', {
    p_attendance_id: input.attendanceId,
    p_kind: input.kind,
    p_status: input.status,
    p_latitude: input.latitude ?? null,
    p_longitude: input.longitude ?? null,
    p_accuracy_meters: input.accuracyMeters ?? null,
  });

  if (error) throw new Error(error.message);
  if (typeof data !== 'string') {
    throw new Error('record_location_verification returned no id.');
  }
  return data;
}

/**
 * Fetch all verifications for one attendance record.
 * RLS allows the employee to read their own; admins read scoped rows.
 */
export async function fetchVerificationsForAttendance(
  attendanceId: string,
): Promise<LocationVerification[]> {
  const { data, error } = await supabase
    .from('location_verifications')
    .select(
      'id, attendance_id, kind, status, latitude, longitude, accuracy_meters, distance_meters, created_at',
    )
    .eq('attendance_id', attendanceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LocationVerification[];
}

/**
 * Admin view: last N verifications for a given employee, across all
 * attendance rows. Joins through attendance_records to filter by
 * employee_id. RLS `can_view_employee` enforces sub-admin scoping.
 */
export interface EmployeeVerificationRow extends LocationVerification {
  work_date: string;
}

export async function fetchRecentVerificationsForEmployee(
  employeeId: string,
  limit = 30,
): Promise<EmployeeVerificationRow[]> {
  const { data, error } = await supabase
    .from('location_verifications')
    .select(
      `
      id, attendance_id, kind, status,
      latitude, longitude, accuracy_meters, distance_meters, created_at,
      attendance_records!inner ( work_date, employee_id )
    `,
    )
    .eq('attendance_records.employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  type RawRow = LocationVerification & {
    attendance_records: { work_date: string; employee_id: string } | null;
  };

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    attendance_id: row.attendance_id,
    kind: row.kind,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy_meters: row.accuracy_meters,
    distance_meters: row.distance_meters,
    created_at: row.created_at,
    work_date: row.attendance_records?.work_date ?? '',
  }));
}
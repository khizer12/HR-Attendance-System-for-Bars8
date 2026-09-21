import { supabase } from '@/lib/supabase';
import type {
  OfficeLocation,
  VerificationKind,
  VerificationStatus,
} from '@/types/location';

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
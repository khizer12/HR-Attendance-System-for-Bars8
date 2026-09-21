import { supabase } from '@/lib/supabase';
import type { OfficeLocation } from '@/types/location';

/**
 * Mutations for office locations. Reads live in `@/features/location/api.ts`
 * so the read path stays single-sourced.
 *
 * All writes require super_admin — enforced by RLS on `office_locations`,
 * not by this module.
 */

const OFFICE_COLUMNS =
  'id, name, latitude, longitude, radius_meters, is_active, created_at, updated_at';

export interface OfficeLocationInput {
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export async function createOfficeLocation(
  input: OfficeLocationInput,
): Promise<OfficeLocation> {
  // Force is_active = false on insert. The DB partial unique index only
  // permits one active row, and the migration's DEFAULT is true — which
  // would collide if an active office already exists. Activation is an
  // explicit, separate action.
  const { data, error } = await supabase
    .from('office_locations')
    .insert({ ...input, is_active: false })
    .select(OFFICE_COLUMNS)
    .single<OfficeLocation>();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateOfficeLocation(
  id: string,
  patch: Partial<OfficeLocationInput>,
): Promise<OfficeLocation> {
  const { data, error } = await supabase
    .from('office_locations')
    .update(patch)
    .eq('id', id)
    .select(OFFICE_COLUMNS)
    .single<OfficeLocation>();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Activate exactly one office location.
 *
 * The DB enforces "at most one active row" with a partial unique index,
 * so the current active row must be deactivated before the target is
 * activated. Two sequential updates rather than a transaction — this is
 * a low-frequency, single-admin operation. If the second update fails,
 * the worst outcome is "no active office", which is safe and recoverable
 * (geofenced clock-in returns a clear error and the admin retries).
 */
export async function activateOfficeLocation(id: string): Promise<void> {
  const { error: deactivateError } = await supabase
    .from('office_locations')
    .update({ is_active: false })
    .eq('is_active', true)
    .neq('id', id);

  if (deactivateError) throw new Error(deactivateError.message);

  const { error: activateError } = await supabase
    .from('office_locations')
    .update({ is_active: true })
    .eq('id', id);

  if (activateError) throw new Error(activateError.message);
}

export async function deactivateOfficeLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from('office_locations')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Delete an office location.
 *
 * Historical verification rows are unaffected: `location_verifications`
 * references `attendance_records`, not `office_locations`.
 */
export async function deleteOfficeLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from('office_locations')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
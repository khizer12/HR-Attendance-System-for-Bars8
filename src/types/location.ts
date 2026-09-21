/**
 * Location & verification domain types.
 * Mirrors the enums and tables in migration `20260919182209_geofencing.sql`.
 */

/** Mirrors `public.verification_kind`. */
export type VerificationKind =
  | 'clock_in'
  | 'periodic'
  | 'clock_out'
  | 'manual';

/** Mirrors `public.verification_status`. */
export type VerificationStatus =
  | 'verified'
  | 'outside_geofence'
  | 'permission_denied'
  | 'unavailable'
  | 'invalid'
  | 'missed'
  | 'network_error';

/** Row shape of `public.office_locations`. At most one row may be active. */
export interface OfficeLocation {
  id: string;
  name: string;
  /** WGS-84 latitude, -90..90. */
  latitude: number;
  /** WGS-84 longitude, -180..180. */
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Row shape of `public.location_verifications`. Append-only. */
export interface LocationVerification {
  id: string;
  attendance_id: string;
  kind: VerificationKind;
  status: VerificationStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  distance_meters: number | null;
  created_at: string;
}
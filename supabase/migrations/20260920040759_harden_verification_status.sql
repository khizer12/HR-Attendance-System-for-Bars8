-- ============================================================
-- Migration: harden_verification_status
-- Purpose:
--   The original `record_location_verification` stored the
--   client-provided `status` verbatim. A tampered client could
--   therefore report 'verified' with no coordinates at all, or
--   'verified' with coordinates well outside the geofence.
--
--   This migration moves the spatial decision to the server:
--     - When coordinates are provided and an active office exists,
--       the server computes the distance and derives the status
--       itself. Client status is ignored for spatial claims.
--     - When coordinates are missing, the client may only report
--       absence-of-coords states (permission_denied, unavailable,
--       network_error, missed). Claiming 'verified' without
--       coordinates is rejected; 'outside_geofence' without
--       coordinates is downgraded to 'invalid'.
--
--   All other guarantees are preserved:
--     - Attendance rows are never mutated.
--     - Rows are append-only; failures are recorded, never dropped.
--     - Callers can only write verifications for their own
--       attendance.
-- ============================================================

create or replace function public.record_location_verification(
  p_attendance_id   uuid,
  p_kind            text,
  p_status          text,
  p_latitude        double precision default null,
  p_longitude       double precision default null,
  p_accuracy_meters double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id    uuid := auth.uid();
  v_attendance     record;
  v_new_id         uuid;
  v_office         record;
  v_distance       double precision;
  v_final_status   public.verification_status;
begin
  if v_employee_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_kind not in ('periodic', 'clock_out', 'manual') then
    raise exception 'Invalid verification kind.' using errcode = 'P0001';
  end if;

  if p_status not in (
    'verified',
    'outside_geofence',
    'permission_denied',
    'unavailable',
    'invalid',
    'missed',
    'network_error'
  ) then
    raise exception 'Invalid verification status.' using errcode = 'P0001';
  end if;

  select id, employee_id
  into v_attendance
  from public.attendance_records
  where id = p_attendance_id
  limit 1;

  if v_attendance.id is null then
    raise exception 'Attendance record not found.' using errcode = 'P0001';
  end if;

  if v_attendance.employee_id <> v_employee_id then
    raise exception 'You can only record verifications for your own attendance.'
      using errcode = '42501';
  end if;

  -- Server-side spatial decision.
  if p_latitude is not null and p_longitude is not null then
    if p_latitude < -90 or p_latitude > 90
       or p_longitude < -180 or p_longitude > 180 then
      v_final_status := 'invalid';
    else
      select id, latitude, longitude, radius_meters
      into v_office
      from public.office_locations
      where is_active = true
      limit 1;

      if v_office.id is not null then
        v_distance := public.haversine_meters(
          p_latitude, p_longitude,
          v_office.latitude::double precision,
          v_office.longitude::double precision
        );

        if v_distance <= v_office.radius_meters then
          v_final_status := 'verified';
        else
          v_final_status := 'outside_geofence';
        end if;
      else
        -- No active office. Trust the client's non-spatial status verbatim,
        -- but never let it claim 'verified' when we cannot check.
        if p_status = 'verified' then
          v_final_status := 'invalid';
        else
          v_final_status := p_status::public.verification_status;
        end if;
      end if;
    end if;
  else
    -- No coordinates. Spatial claims are impossible, so reject them.
    if p_status = 'verified' then
      raise exception 'Cannot record verified status without coordinates.'
        using errcode = 'P0001';
    end if;

    if p_status = 'outside_geofence' then
      v_final_status := 'invalid';
    else
      v_final_status := p_status::public.verification_status;
    end if;
  end if;

  insert into public.location_verifications (
    attendance_id, kind, status,
    latitude, longitude, accuracy_meters, distance_meters
  ) values (
    p_attendance_id, p_kind::public.verification_kind,
    v_final_status,
    p_latitude, p_longitude, p_accuracy_meters, v_distance
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- Grants unchanged from the original — function signature is identical.
revoke all on function public.record_location_verification(uuid, text, text, double precision, double precision, double precision) from public;
grant execute on function public.record_location_verification(uuid, text, text, double precision, double precision, double precision) to authenticated;
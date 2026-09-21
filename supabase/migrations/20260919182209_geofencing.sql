-- ============================================================
-- Migration: geofencing
-- Purpose:
--   Configurable office location, periodic verification records,
--   and geofence-aware clock-in.
--
-- Design notes:
--   - location_verifications rows are append-only. Failures are
--     recorded, never dropped, and never alter attendance data.
--   - Distance is computed server-side via haversine_meters().
--   - The client may lie about its coordinates; the server trusts
--     only what it receives and records it verbatim for review.
--   - No INSERT / UPDATE / DELETE policies on location_verifications.
--     All writes go through SECURITY DEFINER RPCs.
-- ============================================================

-- 1. Types ---------------------------------------------------
create type public.verification_kind as enum (
  'clock_in',
  'periodic',
  'clock_out',
  'manual'
);

create type public.verification_status as enum (
  'verified',
  'outside_geofence',
  'permission_denied',
  'unavailable',
  'invalid',
  'missed',
  'network_error'
);

-- 2. office_locations ----------------------------------------
create table public.office_locations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  latitude      numeric(9,6) not null,
  longitude     numeric(9,6) not null,
  radius_meters integer not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint office_locations_lat_valid
    check (latitude between -90 and 90),
  constraint office_locations_lng_valid
    check (longitude between -180 and 180),
  constraint office_locations_radius_positive
    check (radius_meters > 0)
);

comment on table public.office_locations is
  'Configured office locations. At most one may be active at a time.';

-- Enforce "at most one active row" at the storage layer.
create unique index office_locations_only_one_active
  on public.office_locations (is_active)
  where is_active = true;

create trigger office_locations_set_updated_at
before update on public.office_locations
for each row execute function public.set_updated_at();

-- 3. Haversine distance --------------------------------------
-- Returns great-circle distance in meters.
create or replace function public.haversine_meters(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
as $$
  select 6371000.0 * 2.0 * asin(
    sqrt(
      power(sin(radians((lat2 - lat1) / 2.0)), 2)
      + cos(radians(lat1)) * cos(radians(lat2))
        * power(sin(radians((lon2 - lon1) / 2.0)), 2)
    )
  );
$$;

comment on function public.haversine_meters(double precision, double precision, double precision, double precision) is
  'Great-circle distance between two coordinates, in meters.';

revoke all on function public.haversine_meters(double precision, double precision, double precision, double precision) from public;

-- 4. location_verifications ----------------------------------
create table public.location_verifications (
  id               uuid primary key default gen_random_uuid(),
  attendance_id    uuid not null references public.attendance_records (id) on delete cascade,
  kind             public.verification_kind not null,
  status           public.verification_status not null,
  latitude         numeric(9,6),
  longitude        numeric(9,6),
  accuracy_meters  numeric(8,2),
  distance_meters  numeric(10,2),
  created_at       timestamptz not null default now(),

  constraint lv_coords_together
    check ((latitude is null) = (longitude is null)),
  constraint lv_lat_valid
    check (latitude is null or latitude between -90 and 90),
  constraint lv_lng_valid
    check (longitude is null or longitude between -180 and 180),
  constraint lv_accuracy_nonneg
    check (accuracy_meters is null or accuracy_meters >= 0),
  constraint lv_distance_nonneg
    check (distance_meters is null or distance_meters >= 0)
);

comment on table public.location_verifications is
  'Append-only record of location verifications. Failures are preserved.';

create index location_verifications_attendance_idx
  on public.location_verifications (attendance_id, created_at desc);

-- 5. RLS on office_locations --------------------------------
alter table public.office_locations enable row level security;

create policy "office_locations_select_authenticated"
on public.office_locations
for select
to authenticated
using (true);

create policy "office_locations_insert_super_admin"
on public.office_locations
for insert
to authenticated
with check (public.is_super_admin());

create policy "office_locations_update_super_admin"
on public.office_locations
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "office_locations_delete_super_admin"
on public.office_locations
for delete
to authenticated
using (public.is_super_admin());

-- 6. RLS on location_verifications ---------------------------
alter table public.location_verifications enable row level security;

create policy "location_verifications_select_own"
on public.location_verifications
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_records ar
    where ar.id = location_verifications.attendance_id
      and ar.employee_id = auth.uid()
  )
);

create policy "location_verifications_select_scoped"
on public.location_verifications
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_records ar
    where ar.id = location_verifications.attendance_id
      and public.can_view_employee(ar.employee_id)
  )
);

-- No INSERT / UPDATE / DELETE policies — RPCs only.

-- 7. Replace clock_in() with geofence-aware version ----------
drop function if exists public.clock_in();

create or replace function public.clock_in(
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
  v_employee_id         uuid := auth.uid();
  v_existing_id         uuid;
  v_new_id              uuid;
  v_work_date           date;
  v_dow                 int;
  v_schedule            record;
  v_scheduled_start     timestamptz;
  v_scheduled_end       timestamptz;
  v_now                 timestamptz := now();
  v_minutes_past_start  int;
  v_late_minutes        int := 0;
  v_status              public.attendance_status;
  v_office              record;
  v_distance_meters     double precision;
  v_verification_status public.verification_status;
begin
  if v_employee_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  v_work_date := public.business_date();

  -- Rule 1: reject if there is an open session
  select id into v_existing_id
  from public.attendance_records
  where employee_id = v_employee_id
    and clock_out_at is null
  limit 1;

  if v_existing_id is not null then
    raise exception 'You already have an open attendance session.'
      using errcode = 'P0001';
  end if;

  -- Rule 2: reject duplicate for today
  select id into v_existing_id
  from public.attendance_records
  where employee_id = v_employee_id
    and work_date = v_work_date
  limit 1;

  if v_existing_id is not null then
    raise exception 'You already have an attendance record for today.'
      using errcode = 'P0001';
  end if;

  -- Load schedule
  select
    s.id,
    s.name,
    s.start_time,
    s.end_time,
    s.working_days,
    s.grace_period_minutes,
    s.location_required
  into v_schedule
  from public.profiles p
  join public.schedules s on s.id = p.schedule_id
  where p.id = v_employee_id
    and s.active = true
  limit 1;

  if v_schedule.id is null then
    raise exception
      'You have no active schedule assigned. Contact your administrator.'
      using errcode = 'P0001';
  end if;

  -- Rule 15: unscheduled days reject normal attendance
  v_dow := extract(dow from v_work_date)::int;
  if not (v_dow = any(v_schedule.working_days)) then
    raise exception 'Today is not a working day for your schedule.'
      using errcode = 'P0001';
  end if;

  -- Geofence enforcement when schedule requires it.
  if v_schedule.location_required then
    select id, latitude, longitude, radius_meters
    into v_office
    from public.office_locations
    where is_active = true
    limit 1;

    if v_office.id is null then
      raise exception
        'Location required but no office location is configured. Contact your administrator.'
        using errcode = 'P0001';
    end if;

    if p_latitude is null or p_longitude is null then
      raise exception
        'Location required for clock-in. Enable location access and try again.'
        using errcode = 'P0001';
    end if;

    if p_latitude < -90 or p_latitude > 90
       or p_longitude < -180 or p_longitude > 180 then
      raise exception 'Invalid coordinates received.'
        using errcode = 'P0001';
    end if;

    v_distance_meters := public.haversine_meters(
      p_latitude, p_longitude,
      v_office.latitude::double precision, v_office.longitude::double precision
    );

    if v_distance_meters > v_office.radius_meters then
      raise exception
        'You are outside the office geofence (% m from office, radius % m).',
        round(v_distance_meters)::int, v_office.radius_meters
        using errcode = 'P0001';
    end if;

    v_verification_status := 'verified';
  else
    v_verification_status := null;
  end if;

  -- Compute scheduled window (Dubai time).
  v_scheduled_start :=
    (v_work_date::timestamp + v_schedule.start_time) at time zone 'Asia/Dubai';
  v_scheduled_end :=
    (v_work_date::timestamp + v_schedule.end_time) at time zone 'Asia/Dubai';

  v_minutes_past_start :=
    floor(extract(epoch from (v_now - v_scheduled_start)) / 60)::int;

  if v_minutes_past_start > v_schedule.grace_period_minutes then
    v_status := 'late';
    v_late_minutes := greatest(0, v_minutes_past_start);
  else
    v_status := 'on_time';
    v_late_minutes := 0;
  end if;

  insert into public.attendance_records (
    employee_id, work_date, clock_in_at, status, late_minutes,
    scheduled_start_at, scheduled_end_at
  ) values (
    v_employee_id, v_work_date, v_now, v_status, v_late_minutes,
    v_scheduled_start, v_scheduled_end
  )
  returning id into v_new_id;

  -- Record clock-in verification (only if we actually enforced it).
  if v_verification_status is not null then
    insert into public.location_verifications (
      attendance_id, kind, status,
      latitude, longitude, accuracy_meters, distance_meters
    ) values (
      v_new_id, 'clock_in', v_verification_status,
      p_latitude, p_longitude, p_accuracy_meters, v_distance_meters
    );
  end if;

  return v_new_id;
end;
$$;

-- 8. record_location_verification() --------------------------
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
  v_employee_id uuid := auth.uid();
  v_attendance  record;
  v_new_id      uuid;
  v_office      record;
  v_distance    double precision;
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

  if p_latitude is not null and p_longitude is not null then
    select id, latitude, longitude
    into v_office
    from public.office_locations
    where is_active = true
    limit 1;

    if v_office.id is not null then
      v_distance := public.haversine_meters(
        p_latitude, p_longitude,
        v_office.latitude::double precision, v_office.longitude::double precision
      );
    end if;
  end if;

  insert into public.location_verifications (
    attendance_id, kind, status,
    latitude, longitude, accuracy_meters, distance_meters
  ) values (
    p_attendance_id, p_kind::public.verification_kind,
    p_status::public.verification_status,
    p_latitude, p_longitude, p_accuracy_meters, v_distance
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- 9. Grants --------------------------------------------------
revoke all on function public.clock_in(double precision, double precision, double precision) from public;
grant execute on function public.clock_in(double precision, double precision, double precision) to authenticated;

revoke all on function public.record_location_verification(uuid, text, text, double precision, double precision, double precision) from public;
grant execute on function public.record_location_verification(uuid, text, text, double precision, double precision, double precision) to authenticated;
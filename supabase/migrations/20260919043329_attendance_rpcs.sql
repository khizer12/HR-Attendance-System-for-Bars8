-- ============================================================
-- Migration: attendance_rpcs
-- Purpose:
--   SECURITY DEFINER RPCs are the ONLY way to write attendance
--   data from the client. Every timestamp comes from now().
--   The browser clock is never trusted.
--   Every rule from the spec is enforced server-side.
-- ============================================================

-- 1. Business date helper ------------------------------
-- Returns today's date in the business timezone. Stable because
-- now() is stable within a transaction.
create or replace function public.business_date(
  p_tz text default 'Asia/Dubai'
)
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select (now() at time zone p_tz)::date;
$$;

comment on function public.business_date(text) is
  'Current business date in the configured timezone.';

-- 2. attendance_state() --------------------------------
-- Returns the caller's current state machine value.
create or replace function public.attendance_state()
returns text
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  with today as (
    select id, clock_out_at
    from public.attendance_records
    where employee_id = auth.uid()
      and work_date = public.business_date()
    limit 1
  ),
  active_break as (
    select 1 from public.break_records
    where attendance_id = (select id from today)
      and break_end_at is null
    limit 1
  ),
  any_break as (
    select 1 from public.break_records
    where attendance_id = (select id from today)
    limit 1
  )
  select
    case
      when not exists (select 1 from today) then 'NOT_CHECKED_IN'
      when (select clock_out_at from today) is not null then 'CHECKED_OUT'
      when exists (select 1 from active_break) then 'ON_BREAK'
      when exists (select 1 from any_break) then 'BACK_FROM_BREAK'
      else 'CHECKED_IN'
    end;
$$;

-- 3. clock_in() ----------------------------------------
-- Rule 1 (one open session), Rule 2 (no duplicates), Rule 12 (server time)
create or replace function public.clock_in()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id uuid := auth.uid();
  v_existing_id uuid;
  v_new_id uuid;
begin
  if v_employee_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

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

  -- Rule 2: reject if there is already a record for today
  select id into v_existing_id
  from public.attendance_records
  where employee_id = v_employee_id
    and work_date = public.business_date()
  limit 1;

  if v_existing_id is not null then
    raise exception 'You already have an attendance record for today.'
      using errcode = 'P0001';
  end if;

  insert into public.attendance_records (
    employee_id,
    work_date,
    clock_in_at
  ) values (
    v_employee_id,
    public.business_date(),
    now()
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- 4. start_break() -------------------------------------
-- Rule 7 (must be clocked in), Rule 8 (one active break)
create or replace function public.start_break()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id uuid := auth.uid();
  v_attendance_id uuid;
  v_active_break_id uuid;
  v_new_id uuid;
begin
  if v_employee_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select id into v_attendance_id
  from public.attendance_records
  where employee_id = v_employee_id
    and clock_out_at is null
  limit 1;

  if v_attendance_id is null then
    raise exception 'You must be clocked in to start a break.'
      using errcode = 'P0001';
  end if;

  select id into v_active_break_id
  from public.break_records
  where attendance_id = v_attendance_id
    and break_end_at is null
  limit 1;

  if v_active_break_id is not null then
    raise exception 'You are already on a break.'
      using errcode = 'P0001';
  end if;

  insert into public.break_records (
    attendance_id,
    break_start_at
  ) values (
    v_attendance_id,
    now()
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- 5. end_break() ---------------------------------------
-- Rule 9 (break must end before clock-out)
create or replace function public.end_break()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id uuid := auth.uid();
  v_attendance_id uuid;
  v_break_id uuid;
begin
  if v_employee_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select id into v_attendance_id
  from public.attendance_records
  where employee_id = v_employee_id
    and clock_out_at is null
  limit 1;

  if v_attendance_id is null then
    raise exception 'You are not clocked in.'
      using errcode = 'P0001';
  end if;

  select id into v_break_id
  from public.break_records
  where attendance_id = v_attendance_id
    and break_end_at is null
  limit 1;

  if v_break_id is null then
    raise exception 'You are not on a break.'
      using errcode = 'P0001';
  end if;

  update public.break_records
  set break_end_at = now(),
      duration_minutes = greatest(
        0,
        (extract(epoch from (now() - break_start_at))::int / 60)
      )
  where id = v_break_id;

  return v_break_id;
end;
$$;

-- 6. clock_out() ---------------------------------------
-- Rule 4 (must have session), Rule 5 (closes), Rule 6 (not while on break),
-- Rule 10, 17 (break + work durations non-negative)
create or replace function public.clock_out()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id uuid := auth.uid();
  v_record record;
  v_active_break_id uuid;
  v_total_break_minutes integer;
  v_total_work_minutes integer;
begin
  if v_employee_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Lock the open record so concurrent clock_out calls can't both succeed
  select * into v_record
  from public.attendance_records
  where employee_id = v_employee_id
    and clock_out_at is null
  for update
  limit 1;

  if v_record.id is null then
    raise exception 'You are not clocked in.'
      using errcode = 'P0001';
  end if;

  select id into v_active_break_id
  from public.break_records
  where attendance_id = v_record.id
    and break_end_at is null
  limit 1;

  if v_active_break_id is not null then
    raise exception 'End your break before clocking out.'
      using errcode = 'P0001';
  end if;

  select coalesce(sum(duration_minutes), 0)::int into v_total_break_minutes
  from public.break_records
  where attendance_id = v_record.id;

  v_total_work_minutes := greatest(
    0,
    (extract(epoch from (now() - v_record.clock_in_at))::int / 60)
      - v_total_break_minutes
  );

  update public.attendance_records
  set clock_out_at = now(),
      total_break_minutes = v_total_break_minutes,
      total_work_minutes = v_total_work_minutes
  where id = v_record.id;

  return v_record.id;
end;
$$;

-- 7. get_today_summary() -------------------------------
-- Single call that returns everything the dashboard needs.
create or replace function public.get_today_summary()
returns table (
  state text,
  attendance_id uuid,
  work_date date,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  total_work_minutes integer,
  total_break_minutes integer,
  active_break_id uuid,
  active_break_started_at timestamptz,
  status public.attendance_status,
  late_minutes integer
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  with today as (
    select *
    from public.attendance_records
    where employee_id = auth.uid()
      and work_date = public.business_date()
    limit 1
  ),
  active_break as (
    select id, break_start_at
    from public.break_records
    where attendance_id = (select id from today)
      and break_end_at is null
    limit 1
  ),
  any_break as (
    select 1
    from public.break_records
    where attendance_id = (select id from today)
    limit 1
  )
  select
    case
      when not exists (select 1 from today) then 'NOT_CHECKED_IN'
      when (select clock_out_at from today) is not null then 'CHECKED_OUT'
      when exists (select 1 from active_break) then 'ON_BREAK'
      when exists (select 1 from any_break) then 'BACK_FROM_BREAK'
      else 'CHECKED_IN'
    end,
    (select id from today),
    (select work_date from today),
    (select clock_in_at from today),
    (select clock_out_at from today),
    (select total_work_minutes from today),
    (select total_break_minutes from today),
    (select id from active_break),
    (select break_start_at from active_break),
    (select status from today),
    (select late_minutes from today);
$$;

-- 8. Grants --------------------------------------------
-- Internal helper is not exposed to clients.
revoke all on function public.business_date(text) from public;

revoke all on function public.attendance_state() from public;
revoke all on function public.clock_in() from public;
revoke all on function public.start_break() from public;
revoke all on function public.end_break() from public;
revoke all on function public.clock_out() from public;
revoke all on function public.get_today_summary() from public;

grant execute on function public.attendance_state() to authenticated;
grant execute on function public.clock_in() to authenticated;
grant execute on function public.start_break() to authenticated;
grant execute on function public.end_break() to authenticated;
grant execute on function public.clock_out() to authenticated;
grant execute on function public.get_today_summary() to authenticated;
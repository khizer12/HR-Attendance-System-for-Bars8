-- ============================================================
-- Migration: schedules
-- Purpose:
--   Introduce schedules and assign them to employees.
--   Update clock_in() to enforce schedule rules (Rule 14, 15)
--   and compute lateness (Rule 13).
-- ============================================================

-- 1. Schedules table ----------------------------------------
create table public.schedules (
  id                            uuid primary key default gen_random_uuid(),
  name                          text not null,
  start_time                    time not null,
  end_time                      time not null,
  -- DOW array: 0=Sunday, 1=Monday, ..., 6=Saturday (Postgres extract(dow))
  working_days                  int[] not null default array[1,2,3,4,5],
  grace_period_minutes          int not null default 10,
  break_required                boolean not null default false,
  min_break_minutes             int,
  max_break_minutes             int,
  location_required             boolean not null default false,
  verification_interval_minutes int not null default 30,
  active                        boolean not null default true,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),

  -- Overnight schedules are unsupported. Reject explicitly.
  constraint schedules_end_after_start
    check (end_time > start_time),

  constraint schedules_grace_nonneg
    check (grace_period_minutes >= 0),

  constraint schedules_verification_positive
    check (verification_interval_minutes > 0),

  constraint schedules_min_break_nonneg
    check (min_break_minutes is null or min_break_minutes >= 0),

  constraint schedules_max_break_positive
    check (max_break_minutes is null or max_break_minutes > 0),

  constraint schedules_break_range_valid
    check (
      min_break_minutes is null
      or max_break_minutes is null
      or max_break_minutes >= min_break_minutes
    ),

  constraint schedules_working_days_valid
    check (
      array_length(working_days, 1) >= 1
      and working_days <@ array[0,1,2,3,4,5,6]
    )
);

comment on table public.schedules is
  'Working hours, days, grace period, and rules. One row per schedule.';

create trigger schedules_set_updated_at
before update on public.schedules
for each row execute function public.set_updated_at();

-- 2. profiles.schedule_id -----------------------------------
alter table public.profiles
  add column schedule_id uuid references public.schedules(id) on delete set null;

create index profiles_schedule_idx
  on public.profiles (schedule_id)
  where schedule_id is not null;

-- 3. Seed a default schedule --------------------------------
insert into public.schedules (
  name, start_time, end_time, working_days, grace_period_minutes
)
values (
  'Default 10:30 – 19:30',
  '10:30',
  '19:30',
  array[1,2,3,4,5], -- Mon–Fri
  10
);

-- 4. Assign default to all existing profiles ----------------
update public.profiles
set schedule_id = (
  select id from public.schedules
  where name = 'Default 10:30 – 19:30'
  limit 1
)
where schedule_id is null;

-- 5. Auto-assign default on new user signup -----------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_default_schedule_id uuid;
begin
  select id into v_default_schedule_id
  from public.schedules
  where active = true
  order by created_at asc
  limit 1;

  insert into public.profiles (id, email, full_name, schedule_id)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    v_default_schedule_id
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 6. Replace clock_in() with schedule-aware version ---------
create or replace function public.clock_in()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id        uuid := auth.uid();
  v_existing_id        uuid;
  v_new_id             uuid;
  v_work_date          date;
  v_dow                int;
  v_schedule           record;
  v_scheduled_start    timestamptz;
  v_scheduled_end      timestamptz;
  v_now                timestamptz := now();
  v_minutes_past_start int;
  v_late_minutes       int := 0;
  v_status             public.attendance_status;
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

  -- Rule 14: schedules are authoritative.
  select
    s.id           as id,
    s.name         as name,
    s.start_time   as start_time,
    s.end_time     as end_time,
    s.working_days as working_days,
    s.grace_period_minutes as grace_period_minutes
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

  -- Rule 15: unscheduled days reject normal attendance.
  v_dow := extract(dow from v_work_date)::int;
  if not (v_dow = any(v_schedule.working_days)) then
    raise exception 'Today is not a working day for your schedule.'
      using errcode = 'P0001';
  end if;

  -- Compute scheduled window (Dubai time).
  v_scheduled_start :=
    (v_work_date::timestamp + v_schedule.start_time) at time zone 'Asia/Dubai';
  v_scheduled_end :=
    (v_work_date::timestamp + v_schedule.end_time) at time zone 'Asia/Dubai';

  -- Rule 13: lateness from schedule + grace period.
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
    employee_id,
    work_date,
    clock_in_at,
    status,
    late_minutes,
    scheduled_start_at,
    scheduled_end_at
  ) values (
    v_employee_id,
    v_work_date,
    v_now,
    v_status,
    v_late_minutes,
    v_scheduled_start,
    v_scheduled_end
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- 7. RLS on schedules ---------------------------------------
alter table public.schedules enable row level security;

-- Any signed-in user can read schedules (needed for their own schedule display).
create policy "schedules_select_authenticated"
on public.schedules
for select
to authenticated
using (true);

-- Only super admins can create / update / delete.
create policy "schedules_insert_super_admin"
on public.schedules
for insert
to authenticated
with check (public.is_super_admin());

create policy "schedules_update_super_admin"
on public.schedules
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "schedules_delete_super_admin"
on public.schedules
for delete
to authenticated
using (public.is_super_admin());
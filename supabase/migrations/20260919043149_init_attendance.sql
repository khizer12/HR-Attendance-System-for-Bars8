-- ============================================================
-- Migration: init_attendance
-- Tables: attendance_records, break_records
--
-- Purpose:
--   Core attendance tables with hard integrity constraints.
--   Every write goes through a SECURITY DEFINER RPC (next migration).
--   RLS allows employees to SELECT only their own rows.
--   No INSERT / UPDATE / DELETE policies exist — direct client writes
--   are impossible by design.
-- ============================================================

-- 1. Attendance status enum --------------------------------
create type public.attendance_status as enum (
  'on_time',
  'late',
  'absent'
);

-- 2. attendance_records table ------------------------------
create table public.attendance_records (
  id                    uuid primary key default gen_random_uuid(),
  employee_id           uuid not null references public.profiles (id) on delete restrict,
  work_date             date not null,
  clock_in_at           timestamptz not null default now(),
  clock_out_at          timestamptz,
  status                public.attendance_status,
  total_work_minutes    integer,
  total_break_minutes   integer,
  late_minutes          integer not null default 0,
  scheduled_start_at    timestamptz,
  scheduled_end_at      timestamptz,
  flagged               boolean not null default false,
  flag_reason           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint attendance_records_clock_out_after_in
    check (clock_out_at is null or clock_out_at >= clock_in_at),
  constraint attendance_records_work_minutes_nonneg
    check (total_work_minutes is null or total_work_minutes >= 0),
  constraint attendance_records_break_minutes_nonneg
    check (total_break_minutes is null or total_break_minutes >= 0),
  constraint attendance_records_late_minutes_nonneg
    check (late_minutes >= 0),
  constraint attendance_records_flag_reason_when_flagged
    check (flagged = false or flag_reason is not null)
);

comment on table public.attendance_records is
  'One row per employee per business day. Timestamps stored in UTC.';

-- 3. Partial unique index — Rule 1: one open session per employee.
-- Even if application code fails, the DB refuses a second open session.
create unique index attendance_records_one_open_per_employee
  on public.attendance_records (employee_id)
  where clock_out_at is null;

-- 4. One record per employee per business day — Rule 2, 18.
create unique index attendance_records_employee_work_date
  on public.attendance_records (employee_id, work_date);

-- 5. Query indexes ------------------------------------------
create index attendance_records_work_date_idx
  on public.attendance_records (work_date desc);

create index attendance_records_employee_work_date_desc_idx
  on public.attendance_records (employee_id, work_date desc);

-- 6. updated_at auto-touch (reuses the function from Phase 3) ---
create trigger attendance_records_set_updated_at
before update on public.attendance_records
for each row execute function public.set_updated_at();

-- 7. break_records table ------------------------------------
create table public.break_records (
  id                uuid primary key default gen_random_uuid(),
  attendance_id     uuid not null references public.attendance_records (id) on delete cascade,
  break_start_at    timestamptz not null default now(),
  break_end_at      timestamptz,
  duration_minutes  integer,
  created_at        timestamptz not null default now(),

  constraint break_records_end_after_start
    check (break_end_at is null or break_end_at >= break_start_at),
  constraint break_records_duration_nonneg
    check (duration_minutes is null or duration_minutes >= 0),
  constraint break_records_duration_requires_end
    check ((duration_minutes is null) = (break_end_at is null))
);

comment on table public.break_records is
  'One row per break within an attendance session.';

-- 8. Rule 8: only one active break per attendance session.
create unique index break_records_one_open_per_attendance
  on public.break_records (attendance_id)
  where break_end_at is null;

-- 9. Query index --------------------------------------------
create index break_records_attendance_idx
  on public.break_records (attendance_id, break_start_at desc);

-- 10. Enable RLS --------------------------------------------
alter table public.attendance_records enable row level security;
alter table public.break_records enable row level security;

-- 11. RLS policies ------------------------------------------
-- Employees read their own attendance rows.
create policy "attendance_records_select_own"
on public.attendance_records
for select
to authenticated
using (employee_id = auth.uid());

-- Super admins read every attendance row.
create policy "attendance_records_select_super_admin"
on public.attendance_records
for select
to authenticated
using (public.is_super_admin());

-- NO INSERT / UPDATE / DELETE policies on attendance_records.
-- All writes must go through SECURITY DEFINER RPCs (next migration).

-- Employees read break rows belonging to their own attendance.
create policy "break_records_select_own"
on public.break_records
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_records ar
    where ar.id = break_records.attendance_id
      and ar.employee_id = auth.uid()
  )
);

-- Super admins read every break row.
create policy "break_records_select_super_admin"
on public.break_records
for select
to authenticated
using (public.is_super_admin());

-- NO INSERT / UPDATE / DELETE policies on break_records.
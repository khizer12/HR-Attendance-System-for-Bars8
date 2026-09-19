-- ============================================================
-- Migration: report_attendance_rpc
-- Purpose:
--   Aggregated attendance report for a bounded date range.
--   Produces one row per (employee, working day) with the
--   actual attendance record or a derived 'absent' status.
--
-- Scoping:
--   super_admin sees all departments.
--   sub_admin sees only employees whose department is in their
--   managed_departments array.
--
-- Absence semantics:
--   A past working day (per the employee's schedule) with no
--   attendance record is reported as 'absent'. Today is excluded
--   — the day isn't over, so absence can't be assumed.
-- ============================================================

create or replace function public.report_attendance(
  p_start_date  date,
  p_end_date    date,
  p_employee_id uuid default null,
  p_status      text default null
)
returns table (
  employee_id          uuid,
  email                text,
  full_name            text,
  department           text,
  work_date            date,
  status               text,
  clock_in_at          timestamptz,
  clock_out_at         timestamptz,
  total_work_minutes   integer,
  total_break_minutes  integer,
  late_minutes         integer
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
begin
  if not (public.is_super_admin() or public.is_sub_admin()) then
    raise exception 'Access denied: admin only'
      using errcode = '42501';
  end if;

  if p_start_date > p_end_date then
    raise exception 'Start date must be on or before end date.'
      using errcode = 'P0001';
  end if;

  if (p_end_date - p_start_date) > 366 then
    raise exception 'Date range too large (maximum 366 days).'
      using errcode = 'P0001';
  end if;

  if p_status is not null
     and p_status not in ('on_time', 'late', 'absent') then
    raise exception 'Invalid status filter.'
      using errcode = 'P0001';
  end if;

  return query
  with dates as (
    select generate_series(
      p_start_date,
      p_end_date,
      interval '1 day'
    )::date as d
  ),
  scoped_profiles as (
    select
      p.id,
      p.email,
      p.full_name,
      p.department,
      p.schedule_id
    from public.profiles p
    where p.active = true
      and (p_employee_id is null or p.id = p_employee_id)
      and (
        public.is_super_admin()
        or (
          public.is_sub_admin()
          and exists (
            select 1
            from public.profiles caller
            where caller.id = auth.uid()
              and p.department is not null
              and p.department = any(caller.managed_departments)
          )
        )
      )
  ),
  expected_days as (
    select
      sp.id as employee_id,
      sp.email,
      sp.full_name,
      sp.department,
      d.d as work_date
    from scoped_profiles sp
    join public.schedules s
      on s.id = sp.schedule_id
     and s.active = true
    cross join dates d
    where extract(dow from d.d)::int = any(s.working_days)
      -- exclude today and future days: absence can't be assumed
      and d.d < (now() at time zone 'Asia/Dubai')::date
  )
  select
    ed.employee_id,
    ed.email,
    ed.full_name,
    ed.department,
    ed.work_date,
    coalesce(ar.status::text, 'absent') as status,
    ar.clock_in_at,
    ar.clock_out_at,
    ar.total_work_minutes,
    ar.total_break_minutes,
    coalesce(ar.late_minutes, 0) as late_minutes
  from expected_days ed
  left join public.attendance_records ar
    on ar.employee_id = ed.employee_id
   and ar.work_date = ed.work_date
  where p_status is null
     or coalesce(ar.status::text, 'absent') = p_status
  order by ed.work_date desc, ed.full_name nulls last, ed.email;
end;
$$;

comment on function public.report_attendance(date, date, uuid, text) is
  'Scoped attendance report over a bounded date range.';

revoke all on function public.report_attendance(date, date, uuid, text) from public;
grant execute on function public.report_attendance(date, date, uuid, text) to authenticated;
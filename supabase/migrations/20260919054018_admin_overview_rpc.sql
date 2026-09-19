-- ============================================================
-- Migration: admin_overview_rpc
-- Purpose:
--   Single RPC that returns one row per active employee with
--   their current state, clock times, work/break minutes, and
--   lateness — for the given business day.
--   Restricted to super_admin only (sub_admin scoping arrives in Phase 8).
-- ============================================================

create or replace function public.admin_today_overview()
returns table (
  employee_id            uuid,
  email                  text,
  full_name              text,
  role                   public.user_role,
  state                  text,
  attendance_id          uuid,
  clock_in_at            timestamptz,
  clock_out_at           timestamptz,
  total_work_minutes     integer,
  total_break_minutes    integer,
  active_break_started_at timestamptz,
  late_minutes           integer,
  attendance_status      public.attendance_status
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Only super admins may call this. RLS would otherwise return
  -- just the caller's own row — but we want a clear error instead.
  if not public.is_super_admin() then
    raise exception 'Access denied: admin only'
      using errcode = '42501';
  end if;

  return query
    with today as (
      select
        ar.id,
        ar.employee_id,
        ar.clock_in_at,
        ar.clock_out_at,
        ar.total_work_minutes,
        ar.total_break_minutes,
        ar.late_minutes,
        ar.status
      from public.attendance_records ar
      where ar.work_date = public.business_date()
    ),
    active_breaks as (
      select br.attendance_id, br.break_start_at
      from public.break_records br
      where br.break_end_at is null
    ),
    any_breaks as (
      select distinct br.attendance_id
      from public.break_records br
    )
    select
      p.id,
      p.email,
      p.full_name,
      p.role,
      case
        when t.id is null then 'NOT_CHECKED_IN'
        when t.clock_out_at is not null then 'CHECKED_OUT'
        when ab.attendance_id is not null then 'ON_BREAK'
        when aany.attendance_id is not null then 'BACK_FROM_BREAK'
        else 'CHECKED_IN'
      end,
      t.id,
      t.clock_in_at,
      t.clock_out_at,
      t.total_work_minutes,
      t.total_break_minutes,
      ab.break_start_at,
      t.late_minutes,
      t.status
    from public.profiles p
    left join today t on t.employee_id = p.id
    left join active_breaks ab on ab.attendance_id = t.id
    left join any_breaks aany on aany.attendance_id = t.id
    where p.active = true
    order by p.full_name nulls last, p.email;
end;
$$;

comment on function public.admin_today_overview() is
  'Admin-only summary of every active employee''s current attendance state.';

revoke all on function public.admin_today_overview() from public;
grant execute on function public.admin_today_overview() to authenticated;
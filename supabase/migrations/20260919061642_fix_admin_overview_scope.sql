-- Fix admin_today_overview(): the previous version used
--    p.department = any ((select managed_departments ...))
-- PostgreSQL treats the subquery as a scalar row, producing
--    text = text[]
-- which has no matching operator.
--
-- Rewriting as an EXISTS subquery with a column reference,
-- matching the pattern used in can_view_employee().

create or replace function public.admin_today_overview()
returns table (
  employee_id            uuid,
  email                  text,
  full_name              text,
  role                   public.user_role,
  department             text,
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
  if not (public.is_super_admin() or public.is_sub_admin()) then
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
      p.department,
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
    order by p.full_name nulls last, p.email;
end;
$$;
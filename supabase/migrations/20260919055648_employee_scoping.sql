-- ============================================================
-- Migration: employee_scoping
-- Purpose:
--   Introduce department-based scoping for sub-admins.
--   Every RLS policy that grants cross-employee access now goes
--   through can_view_employee(), so scope rules live in one place.
-- ============================================================

-- 1. Extend profiles ----------------------------------------
alter table public.profiles
  add column department text;

alter table public.profiles
  add column managed_departments text[] not null default '{}';

comment on column public.profiles.department is
  'Department the employee belongs to. Used for sub-admin scoping.';

comment on column public.profiles.managed_departments is
  'Only meaningful for sub_admins: the departments whose employees they can access.';

create index profiles_department_idx
  on public.profiles (department)
  where department is not null;

-- 2. Sub-admin predicate ------------------------------------
create or replace function public.is_sub_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'sub_admin'
      and active = true
  );
$$;

revoke all on function public.is_sub_admin() from public;
grant execute on function public.is_sub_admin() to authenticated;

-- 3. The scoping rule — one place, one truth ----------------
-- Returns true when the caller may read the given employee's data.
create or replace function public.can_view_employee(p_employee_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    -- self
    p_employee_id = auth.uid()
    -- super admin sees all
    or public.is_super_admin()
    -- sub admin sees employees in their managed departments
    or (
      public.is_sub_admin()
      and exists (
        select 1
        from public.profiles target
        join public.profiles caller on caller.id = auth.uid()
        where target.id = p_employee_id
          and target.department is not null
          and target.department = any(caller.managed_departments)
      )
    );
$$;

revoke all on function public.can_view_employee(uuid) from public;
grant execute on function public.can_view_employee(uuid) to authenticated;

-- 4. Replace profiles RLS -----------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_super_admin" on public.profiles;
drop policy if exists "profiles_update_super_admin" on public.profiles;

create policy "profiles_select_scoped"
on public.profiles
for select
to authenticated
using (public.can_view_employee(id));

create policy "profiles_update_super_admin"
on public.profiles
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- 5. Replace attendance_records RLS -------------------------
drop policy if exists "attendance_records_select_own" on public.attendance_records;
drop policy if exists "attendance_records_select_super_admin" on public.attendance_records;

create policy "attendance_records_select_scoped"
on public.attendance_records
for select
to authenticated
using (public.can_view_employee(employee_id));

-- 6. Replace break_records RLS ------------------------------
drop policy if exists "break_records_select_own" on public.break_records;
drop policy if exists "break_records_select_super_admin" on public.break_records;

create policy "break_records_select_scoped"
on public.break_records
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_records ar
    where ar.id = break_records.attendance_id
      and public.can_view_employee(ar.employee_id)
  )
);

-- 7. Update admin_today_overview to respect scope -----------
-- Drop first: Postgres forbids changing a function's return type
-- via CREATE OR REPLACE. We added `department` to the OUT tuple.
drop function if exists public.admin_today_overview();

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
      -- Scope: super_admin sees all, sub_admin sees only their departments.
      and (
        public.is_super_admin()
        or (
          public.is_sub_admin()
          and p.department is not null
          and p.department = any(
            (select managed_departments
             from public.profiles
             where id = auth.uid())
          )
        )
      )
    order by p.full_name nulls last, p.email;
end;
$$;

-- 8. Seed the existing admin's department --------------------
update public.profiles
set department = 'Head Office'
where email = 'syedkhizerahmed.124@gmail.com'
  and department is null;
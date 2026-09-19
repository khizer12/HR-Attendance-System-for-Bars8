-- ============================================================
-- Migration: init_profiles
-- Purpose:
--   Bootstrap user roles and the profiles table.
--   Every Supabase Auth user gets a matching profile row via trigger.
--   RLS is enabled with minimal, safe default policies.
-- ============================================================

-- 1. Role enum -----------------------------------------------
create type public.user_role as enum (
  'super_admin',
  'sub_admin',
  'employee'
);

-- 2. Profiles table ------------------------------------------
create table public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  email       text        not null,
  full_name   text        not null default '',
  role        public.user_role not null default 'employee',
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Mirrors auth.users with role metadata.';

-- 3. Indexes -------------------------------------------------
create index profiles_role_idx   on public.profiles (role);
create index profiles_active_idx on public.profiles (active) where active = true;
create index profiles_email_idx  on public.profiles (lower(email));

-- 4. updated_at auto-touch -----------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 5. Helper: is the current user a super admin? --------------
-- SECURITY DEFINER so it can be used inside RLS policies without
-- triggering recursive policy evaluation on public.profiles.
create or replace function public.is_super_admin()
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
      and role = 'super_admin'
      and active = true
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- 6. Auto-create profile on new auth user --------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 7. Enable RLS ----------------------------------------------
alter table public.profiles enable row level security;

-- 8. Policies ------------------------------------------------
-- Users can read their own profile.
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Super admins can read every profile.
create policy "profiles_select_super_admin"
on public.profiles
for select
to authenticated
using (public.is_super_admin());

-- Super admins can update any profile.
create policy "profiles_update_super_admin"
on public.profiles
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- No INSERT policy: only the handle_new_user trigger (SECURITY DEFINER)
-- creates rows. Users cannot insert profiles directly.

-- No DELETE policy: profiles are removed only when the auth.users row
-- is deleted (ON DELETE CASCADE).
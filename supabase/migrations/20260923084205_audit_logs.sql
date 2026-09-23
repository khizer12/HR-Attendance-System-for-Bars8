-- ============================================================
-- Migration: audit_logs
-- Purpose:
--   1. Introduce `audit_logs` — append-only record of every
--      security- or integrity-relevant change to profiles,
--      schedules, and office_locations.
--   2. Attach triggers that write into it automatically.
--   3. Add a `prevent_last_super_admin_removal` guard so a
--      super_admin cannot demote themselves (or the last
--      remaining one) and permanently lock the org out.
--
-- Design notes:
--   - Rows are append-only. No INSERT / UPDATE / DELETE policies.
--     Writes go through the SECURITY DEFINER helper `write_audit_log()`.
--   - Actor identity is captured at write time (id + email) so the
--     log survives deletion of the acting profile.
--   - System-triggered changes (e.g. handle_new_user) have a NULL
--     actor_id. That's deliberate — they are not user actions.
--   - `auth.uid()` inside a trigger fired during a PostgREST request
--     returns the caller's UUID. During a migration or CLI operation
--     it returns NULL. Both are correct.
-- ============================================================

-- 1. audit_logs table -----------------------------------------
create table public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.profiles (id) on delete set null,
  actor_email   text,
  action        text not null,
  target_table  text not null,
  target_id     uuid,
  before        jsonb,
  after         jsonb,
  metadata      jsonb,
  reason        text,
  created_at    timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only audit trail. Rows are never updated or deleted by clients.';

comment on column public.audit_logs.action is
  'Dotted verb, e.g. profile.updated, schedule.created, office_location.activated.';

comment on column public.audit_logs.before is
  'Full row snapshot prior to the change (jsonb). NULL for inserts.';

comment on column public.audit_logs.after is
  'Full row snapshot after the change (jsonb). NULL for deletes.';

-- Query indexes
create index audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index audit_logs_actor_idx
  on public.audit_logs (actor_id, created_at desc)
  where actor_id is not null;

create index audit_logs_target_idx
  on public.audit_logs (target_table, target_id, created_at desc);

create index audit_logs_action_idx
  on public.audit_logs (action, created_at desc);

-- 2. RLS -----------------------------------------------------
alter table public.audit_logs enable row level security;

-- Only super_admins may read the audit trail.
create policy "audit_logs_select_super_admin"
on public.audit_logs
for select
to authenticated
using (public.is_super_admin());

-- No INSERT / UPDATE / DELETE policies. Writes come exclusively from
-- the SECURITY DEFINER helper below. A tampered client cannot write
-- or forge an audit entry.

-- 3. write_audit_log helper ----------------------------------
create or replace function public.write_audit_log(
  p_action       text,
  p_target_table text,
  p_target_id    uuid,
  p_before       jsonb default null,
  p_after        jsonb default null,
  p_metadata     jsonb default null,
  p_reason       text  default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_id    uuid := auth.uid();
  v_actor_email text;
  v_id          uuid;
begin
  if v_actor_id is not null then
    select email into v_actor_email
    from public.profiles
    where id = v_actor_id;
  end if;

  insert into public.audit_logs (
    actor_id, actor_email, action, target_table, target_id,
    before, after, metadata, reason
  ) values (
    v_actor_id, v_actor_email, p_action, p_target_table, p_target_id,
    p_before, p_after, p_metadata, p_reason
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.write_audit_log(text, text, uuid, jsonb, jsonb, jsonb, text) is
  'Internal helper. Called from triggers. Not exposed to clients.';

revoke all on function public.write_audit_log(text, text, uuid, jsonb, jsonb, jsonb, text) from public;

-- 4. Generic diff helper -------------------------------------
-- Returns a jsonb object mapping each changed column to
-- {old, new}. NULL when nothing changed.
create or replace function public.jsonb_diff(
  p_before jsonb,
  p_after  jsonb
)
returns jsonb
language sql
immutable
as $$
  select nullif(
    jsonb_object_agg(
      key,
      jsonb_build_object('old', p_before -> key, 'new', p_after -> key)
    ),
    '{}'::jsonb
  )
  from (
    select key
    from jsonb_object_keys(p_after) as key
    where p_before -> key is distinct from p_after -> key
  ) changed;
$$;

revoke all on function public.jsonb_diff(jsonb, jsonb) from public;

-- 5. Audit trigger: profiles ---------------------------------
create or replace function public.audit_profiles_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_before  jsonb;
  v_after   jsonb;
  v_diff    jsonb;
  v_action  text;
begin
  if tg_op = 'INSERT' then
    v_after := to_jsonb(new);
    perform public.write_audit_log(
      'profile.created', 'profiles', new.id, null, v_after, null, null
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after  := to_jsonb(new);
    v_diff   := public.jsonb_diff(v_before, v_after);

    -- Nothing meaningful changed (only updated_at moved). Skip.
    if v_diff is null then
      return new;
    end if;

    -- Classify the change for filtering/reporting.
    if (v_before ->> 'role') is distinct from (v_after ->> 'role') then
      v_action := 'profile.role_changed';
    elsif (v_before ->> 'active')::boolean is true
       and (v_after  ->> 'active')::boolean is false then
      v_action := 'profile.deactivated';
    elsif (v_before ->> 'active')::boolean is false
       and (v_after  ->> 'active')::boolean is true then
      v_action := 'profile.reactivated';
    elsif (v_before ->> 'schedule_id') is distinct from (v_after ->> 'schedule_id') then
      v_action := 'profile.schedule_changed';
    elsif (v_before ->> 'department') is distinct from (v_after ->> 'department') then
      v_action := 'profile.department_changed';
    else
      v_action := 'profile.updated';
    end if;

    perform public.write_audit_log(
      v_action, 'profiles', new.id, v_before, v_after,
      jsonb_build_object('changed', v_diff),
      null
    );
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_before := to_jsonb(old);
    perform public.write_audit_log(
      'profile.deleted', 'profiles', old.id, v_before, null, null, null
    );
    return old;
  end if;

  return null;
end;
$$;

create trigger profiles_audit
after insert or update or delete on public.profiles
for each row execute function public.audit_profiles_change();

-- 6. Audit trigger: schedules --------------------------------
create or replace function public.audit_schedules_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_before  jsonb;
  v_after   jsonb;
  v_action  text;
begin
  if tg_op = 'INSERT' then
    v_after := to_jsonb(new);
    perform public.write_audit_log(
      'schedule.created', 'schedules', new.id, null, v_after, null, null
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after  := to_jsonb(new);

    -- Skip noise from updated_at-only touch.
    if public.jsonb_diff(v_before, v_after) is null then
      return new;
    end if;

    v_action :=
      case
        when (v_before ->> 'active')::boolean is true
         and (v_after  ->> 'active')::boolean is false
          then 'schedule.deactivated'
        when (v_before ->> 'active')::boolean is false
         and (v_after  ->> 'active')::boolean is true
          then 'schedule.reactivated'
        else 'schedule.updated'
      end;

    perform public.write_audit_log(
      v_action, 'schedules', new.id, v_before, v_after,
      jsonb_build_object('changed', public.jsonb_diff(v_before, v_after)),
      null
    );
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_before := to_jsonb(old);
    perform public.write_audit_log(
      'schedule.deleted', 'schedules', old.id, v_before, null, null, null
    );
    return old;
  end if;

  return null;
end;
$$;

create trigger schedules_audit
after insert or update or delete on public.schedules
for each row execute function public.audit_schedules_change();

-- 7. Audit trigger: office_locations -------------------------
create or replace function public.audit_office_locations_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_before  jsonb;
  v_after   jsonb;
  v_action  text;
begin
  if tg_op = 'INSERT' then
    v_after := to_jsonb(new);
    perform public.write_audit_log(
      'office_location.created', 'office_locations', new.id, null, v_after, null, null
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_before := to_jsonb(old);
    v_after  := to_jsonb(new);

    if public.jsonb_diff(v_before, v_after) is null then
      return new;
    end if;

    v_action :=
      case
        when (v_before ->> 'is_active')::boolean is false
         and (v_after  ->> 'is_active')::boolean is true
          then 'office_location.activated'
        when (v_before ->> 'is_active')::boolean is true
         and (v_after  ->> 'is_active')::boolean is false
          then 'office_location.deactivated'
        else 'office_location.updated'
      end;

    perform public.write_audit_log(
      v_action, 'office_locations', new.id, v_before, v_after,
      jsonb_build_object('changed', public.jsonb_diff(v_before, v_after)),
      null
    );
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_before := to_jsonb(old);
    perform public.write_audit_log(
      'office_location.deleted', 'office_locations', old.id, v_before, null, null, null
    );
    return old;
  end if;

  return null;
end;
$$;

create trigger office_locations_audit
after insert or update or delete on public.office_locations
for each row execute function public.audit_office_locations_change();

-- 8. Self-demotion guard -------------------------------------
-- Prevents a super_admin from demoting themselves or deactivating
-- the last remaining active super_admin, which would brick the org.
create or replace function public.prevent_last_super_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_other_active_super_admins int;
begin
  -- Only guard when we're removing super_admin privilege.
  if old.role <> 'super_admin' then
    return new;
  end if;

  if new.role = 'super_admin' and new.active = true then
    -- Still a super_admin and still active. No guard needed.
    return new;
  end if;

  select count(*)
  into v_other_active_super_admins
  from public.profiles
  where role = 'super_admin'
    and active = true
    and id <> old.id;

  if v_other_active_super_admins = 0 then
    raise exception
      'Cannot remove the last active super_admin. Promote another user first.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function public.prevent_last_super_admin_removal() is
  'Guard: refuses to demote or deactivate the last active super_admin.';

create trigger profiles_prevent_last_super_admin_removal
before update on public.profiles
for each row execute function public.prevent_last_super_admin_removal();

-- 9. Grants --------------------------------------------------
-- Read access comes via the RLS policy; no function grants needed
-- since audit_logs is queried directly by authenticated clients.
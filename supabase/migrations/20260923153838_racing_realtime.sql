-- ============================================================
-- Migration: racing_realtime
-- Purpose:
--   Enable Supabase Realtime publications for the two tables the
--   race view subscribes to. Without this, the client can subscribe
--   but Postgres won't broadcast row-level changes.
--
--   Only the tables needed for the race view. Do not add tables
--   indiscriminately — every table added to the publication fires
--   on every change, cost adds up.
--
--   RLS still applies. Realtime respects the subscriber's auth
--   context: users only receive events for rows they can SELECT.
-- ============================================================

-- Supabase provisions `supabase_realtime` as a publication. We add
-- tables to it. If the publication doesn't exist (fresh project),
-- create it.
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

-- Add only if not already part of the publication (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'attendance_records'
  ) then
    alter publication supabase_realtime add table public.attendance_records;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'break_records'
  ) then
    alter publication supabase_realtime add table public.break_records;
  end if;
end $$;

-- REPLICA IDENTITY FULL causes the OLD record to include all columns
-- in UPDATE/DELETE payloads. Needed so the frontend can match rows to
-- participants without a second query.
alter table public.attendance_records replica identity full;
alter table public.break_records replica identity full;
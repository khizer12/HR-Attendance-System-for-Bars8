-- ============================================================
-- Migration: fix_audit_diff_noise
-- Purpose:
--   `set_updated_at` fires BEFORE the audit trigger, so `updated_at`
--   is always different by the time `jsonb_diff()` compares OLD/NEW.
--   The "no meaningful change" guard therefore never tripped, and
--   every no-op UPDATE produced an audit row.
--
--   Fix: strip `updated_at` (and `created_at` for safety) from the
--   diff before comparing. If nothing else changed, jsonb_diff returns
--   NULL, the audit trigger short-circuits, and no row is written.
--
--   No table schema change. No trigger change. Only the diff helper.
-- ============================================================

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
      -- Ignore auto-maintained timestamp columns. They change on every
      -- UPDATE and would otherwise mask genuine no-op updates.
      and key not in ('updated_at', 'created_at')
  ) changed;
$$;

comment on function public.jsonb_diff(jsonb, jsonb) is
  'Field-by-field diff of two row snapshots. Ignores updated_at and created_at.';
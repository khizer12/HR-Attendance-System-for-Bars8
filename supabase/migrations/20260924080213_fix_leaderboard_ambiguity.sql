-- ============================================================
-- Migration: fix_leaderboard_ambiguity
-- Purpose:
--   The original `leaderboard_for_range` OUT parameters (rank,
--   user_id, etc.) collided with the same-named columns in its
--   own query. Postgres raises 42702 at call time.
--
--   Fix: add `#variable_conflict use_column` at the top of each
--   PL/pgSQL body, telling Postgres to prefer column references
--   when both a column and a variable exist with the same name.
--
--   Function signatures are unchanged, so callers are unaffected.
-- ============================================================

create or replace function public.leaderboard_for_range(
  p_start_date date,
  p_end_date   date,
  p_limit      int default 100
)
returns table (
  rank                int,
  user_id             uuid,
  display_name        text,
  email               text,
  car_id              uuid,
  car_name            text,
  car_color           text,
  work_minutes        int,
  work_seconds        int,
  deposit_usd         numeric,
  boost_minutes       int,
  score_minutes       int
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_multiplier numeric;
begin
  if p_start_date > p_end_date then
    raise exception 'Start date must be on or before end date.'
      using errcode = 'P0001';
  end if;

  if (p_end_date - p_start_date) > 370 then
    raise exception 'Range too large (maximum 370 days).'
      using errcode = 'P0001';
  end if;

  select deposit_multiplier into v_multiplier
  from public.racing_settings
  where id = 1;

  if v_multiplier is null then
    v_multiplier := 0;
  end if;

  return query
  with work as (
    select
      ar.employee_id,
      sum(ar.total_work_minutes)::int as work_minutes,
      coalesce(
        sum(
          greatest(
            0,
            extract(epoch from (ar.clock_out_at - ar.clock_in_at))::int
              - coalesce(ar.total_break_minutes, 0) * 60
          )
        ),
        0
      )::int as work_seconds
    from public.attendance_records ar
    where ar.work_date between p_start_date and p_end_date
      and ar.clock_out_at is not null
      and ar.total_work_minutes is not null
    group by ar.employee_id
  ),
  deposits as (
    select
      rd.user_id,
      sum(rd.amount_usd) as deposit_usd
    from public.racing_deposits rd
    where rd.work_date between p_start_date and p_end_date
    group by rd.user_id
  ),
  base as (
    select
      p.id as user_id,
      coalesce(p.full_name, 'Unnamed racer') as display_name,
      p.email,
      rp.car_id,
      rc.name as car_name,
      rc.accent_color as car_color,
      coalesce(w.work_minutes, 0) as work_minutes,
      coalesce(w.work_seconds, 0) as work_seconds,
      coalesce(d.deposit_usd, 0) as deposit_usd,
      floor(coalesce(d.deposit_usd, 0) * v_multiplier)::int as boost_minutes
    from public.profiles p
    left join work w on w.employee_id = p.id
    left join deposits d on d.user_id = p.id
    left join public.user_racing_profiles rp on rp.user_id = p.id
    left join public.racing_cars rc on rc.id = rp.car_id
    where p.active = true
      and (w.work_minutes is not null or coalesce(d.deposit_usd, 0) > 0)
  ),
  scored as (
    select
      user_id,
      display_name,
      email,
      car_id,
      car_name,
      car_color,
      work_minutes,
      work_seconds,
      deposit_usd,
      boost_minutes,
      work_minutes + boost_minutes as score_minutes
    from base
  )
  select
    (row_number() over (
      order by score_minutes desc, work_seconds desc, display_name asc
    ))::int as rank,
    user_id,
    display_name,
    email,
    car_id,
    car_name,
    car_color,
    work_minutes,
    work_seconds,
    deposit_usd,
    boost_minutes,
    score_minutes
  from scored
  order by rank
  limit p_limit;
end;
$$;

revoke all on function public.leaderboard_for_range(date, date, int) from public;
grant execute on function public.leaderboard_for_range(date, date, int) to authenticated;
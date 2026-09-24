-- ============================================================
-- Migration: leaderboards
-- Purpose:
--   Live leaderboard query across a date range + a weekly freeze
--   mechanism for the Friday 19:30 release.
--
--   Score = work_minutes + (deposits_usd × deposit_multiplier)
--   Tiebreak = seconds worked (down to the second)
--
--   No new columns on existing tables. Deposits come from
--   racing_deposits. Weekly snapshots go into a new table.
-- ============================================================

-- 1. weekly_leaderboard_snapshots ----------------------------
create table public.weekly_leaderboard_snapshots (
  id             uuid primary key default gen_random_uuid(),
  week_start     date not null,
  week_end       date not null,
  -- Frozen final standings, in rank order.
  standings      jsonb not null,
  -- Deposit multiplier that was in effect at freeze time.
  deposit_multiplier numeric(6,3) not null,
  frozen_at      timestamptz not null default now(),

  constraint weekly_snapshot_range_valid
    check (week_start <= week_end),
  constraint weekly_snapshot_unique_week
    unique (week_start)
);

comment on table public.weekly_leaderboard_snapshots is
  'Frozen weekly leaderboard. Written once per completed week by freeze_weekly_leaderboard().';

create index weekly_snapshots_week_start_idx
  on public.weekly_leaderboard_snapshots (week_start desc);

-- 2. RLS on snapshots ----------------------------------------
alter table public.weekly_leaderboard_snapshots enable row level security;

create policy "weekly_snapshots_select_authenticated"
on public.weekly_leaderboard_snapshots
for select
to authenticated
using (true);

-- No INSERT/UPDATE/DELETE policies. Snapshots are written only by
-- the SECURITY DEFINER function below.

-- 3. leaderboard_for_range -----------------------------------
-- Core ranking query. Returns one row per user with a completed
-- attendance record in the range. Users with zero minutes but a
-- positive deposit still appear (deposits alone can rank you).
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
      -- Compute seconds at the second level, using the same net formula
      -- as total_work_minutes but keeping fractional minutes.
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

comment on function public.leaderboard_for_range(date, date, int) is
  'Ranked leaderboard over a date range. Score = work_minutes + deposits × multiplier.';

revoke all on function public.leaderboard_for_range(date, date, int) from public;
grant execute on function public.leaderboard_for_range(date, date, int) to authenticated;

-- 4. leaderboard_current_week --------------------------------
-- Convenience wrapper: Monday..today (or Monday..Friday if past Fri).
create or replace function public.leaderboard_current_week()
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
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with today as (
    select public.business_date() as d
  ),
  bounds as (
    select
      (d - ((extract(dow from d)::int + 6) % 7))::date as week_start,
      d as week_end
    from today
  )
  select *
  from public.leaderboard_for_range(
    (select week_start from bounds),
    (select week_end from bounds),
    100
  );
$$;

revoke all on function public.leaderboard_current_week() from public;
grant execute on function public.leaderboard_current_week() to authenticated;

-- 5. freeze_weekly_leaderboard -------------------------------
-- Idempotent. Freezes the last COMPLETED Mon-Fri week into
-- weekly_leaderboard_snapshots. Callable by any authenticated user.
-- Safe to call from the frontend whenever the weekly tab is opened.
--
-- Rule: only freezes if `now` is past Friday 19:30 Dubai AND
-- there is no snapshot for that week_start yet.
create or replace function public.freeze_weekly_leaderboard()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now       timestamptz := now();
  v_today     date;
  v_dow       int;
  v_week_start date;
  v_week_end   date;
  v_existing  uuid;
  v_standings jsonb;
  v_mult      numeric;
  v_id        uuid;
begin
  -- Today in Dubai.
  v_today := (v_now at time zone 'Asia/Dubai')::date;
  v_dow := extract(dow from v_today)::int; -- 0=Sun, 5=Fri, 6=Sat

  -- Determine the most recently completed Mon-Fri week.
  --
  -- Case 1: today is Saturday or Sunday → this week ended yesterday
  --         or the day before. week_start = the Monday of that week.
  -- Case 2: today is Friday and time >= 19:30 Dubai → freeze this week.
  -- Case 3: today is Mon-Thu OR (Friday before 19:30) → no complete week
  --         yet; check last week's snapshot for idempotency.
  if v_dow = 6 then          -- Saturday
    v_week_start := (v_today - 5)::date;
    v_week_end := (v_today - 1)::date;
  elsif v_dow = 0 then       -- Sunday
    v_week_start := (v_today - 6)::date;
    v_week_end := (v_today - 2)::date;
  elsif v_dow = 5 then       -- Friday
    if (v_now at time zone 'Asia/Dubai')::time >= '19:30'::time then
      v_week_start := (v_today - 4)::date;
      v_week_end := v_today;
    else
      v_week_start := (v_today - 11)::date;
      v_week_end := (v_today - 7)::date;
    end if;
  else                       -- Mon-Thu
    v_week_start := (v_today - (v_dow + 6))::date;
    v_week_end := (v_week_start + 4)::date;
  end if;

  -- Idempotent: bail if we already froze this week.
  select id into v_existing
  from public.weekly_leaderboard_snapshots
  where week_start = v_week_start
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  -- Snapshot the multiplier.
  select deposit_multiplier into v_mult
  from public.racing_settings where id = 1;
  if v_mult is null then v_mult := 0; end if;

  -- Build standings as a jsonb array.
  select coalesce(jsonb_agg(row_to_json(t) order by t.rank), '[]'::jsonb)
  into v_standings
  from (
    select * from public.leaderboard_for_range(v_week_start, v_week_end, 100)
  ) t;

  insert into public.weekly_leaderboard_snapshots (
    week_start, week_end, standings, deposit_multiplier
  ) values (
    v_week_start, v_week_end, v_standings, v_mult
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.freeze_weekly_leaderboard() is
  'Idempotently freeze the last completed Mon-Fri week. Safe to call from the client.';

revoke all on function public.freeze_weekly_leaderboard() from public;
grant execute on function public.freeze_weekly_leaderboard() to authenticated;

-- 6. get_weekly_leaderboard ----------------------------------
-- Reads the most recent snapshot (call freeze first from the client).
create or replace function public.get_weekly_leaderboard()
returns table (
  week_start          date,
  week_end            date,
  frozen_at           timestamptz,
  deposit_multiplier  numeric,
  standings           jsonb
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    s.week_start,
    s.week_end,
    s.frozen_at,
    s.deposit_multiplier,
    s.standings
  from public.weekly_leaderboard_snapshots s
  order by s.week_start desc
  limit 1;
$$;

revoke all on function public.get_weekly_leaderboard() from public;
grant execute on function public.get_weekly_leaderboard() to authenticated;
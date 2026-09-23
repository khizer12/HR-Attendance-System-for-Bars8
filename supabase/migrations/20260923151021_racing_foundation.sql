-- ============================================================
-- Migration: racing_foundation
-- Purpose:  Add the racing layer. Purely additive.
--
-- Changes vs. initial design:
--   - No storage bucket. Users pick from pre-made avatars stored
--     as static files in the frontend's public/avatars/ directory.
--   - `user_racing_profiles.avatar_key` (string identifier) replaces
--     `avatar_url` (storage URL).
--   - New `racing_deposits` table tracks per-day deposit credits
--     that boost a user's speed and rank.
--   - New `racing_settings` singleton row holds the deposit-to-
--     rank multiplier so it can be tuned without a migration.
-- ============================================================

-- 1. racing_cars ---------------------------------------------
create table public.racing_cars (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text not null,
  accent_color    text not null,
  top_speed_kph   integer not null default 300,
  sort_order      integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),

  constraint racing_cars_category_valid
    check (category in (
      'f1', 'gt', 'hypercar', 'rally', 'dirt', 'truck',
      'stock', 'drift', 'prototype', 'suv'
    )),
  constraint racing_cars_top_speed_positive
    check (top_speed_kph > 0)
);

create index racing_cars_sort_idx
  on public.racing_cars (sort_order, name)
  where active = true;

-- 2. racing_tracks -------------------------------------------
create table public.racing_tracks (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  country         text not null,
  path_data       text not null,
  total_laps      integer not null default 10,
  sort_order      integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),

  constraint racing_tracks_total_laps_positive
    check (total_laps > 0)
);

create index racing_tracks_sort_idx
  on public.racing_tracks (sort_order, name)
  where active = true;

-- 3. user_racing_profiles ------------------------------------
create table public.user_racing_profiles (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  car_id          uuid references public.racing_cars (id) on delete set null,
  track_id        uuid references public.racing_tracks (id) on delete set null,
  -- Identifier for a pre-made avatar file: matches a filename in
  -- the frontend's public/avatars/ directory (e.g. 'driver-01').
  avatar_key      text,
  updated_at      timestamptz not null default now()
);

create trigger user_racing_profiles_set_updated_at
before update on public.user_racing_profiles
for each row execute function public.set_updated_at();

-- 4. racing_deposits -----------------------------------------
-- External system POSTs deposits here (via Edge Function or RPC).
-- Each row credits one user one amount on one work_date.
create table public.racing_deposits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  amount_usd    numeric(14,2) not null,
  source_ref    text,
  work_date     date not null default (now() at time zone 'Asia/Dubai')::date,
  created_at    timestamptz not null default now(),

  constraint racing_deposits_amount_positive
    check (amount_usd > 0)
);

create index racing_deposits_user_date_idx
  on public.racing_deposits (user_id, work_date desc);

create index racing_deposits_work_date_idx
  on public.racing_deposits (work_date desc);

-- 5. racing_settings -----------------------------------------
-- Single-row config table. `deposit_multiplier` = how many rank-
-- minutes a $1 deposit is worth.
create table public.racing_settings (
  id                  integer primary key default 1,
  deposit_multiplier  numeric(6,3) not null default 0.060,
  updated_at          timestamptz not null default now(),

  constraint racing_settings_singleton check (id = 1),
  constraint racing_settings_multiplier_nonneg
    check (deposit_multiplier >= 0)
);

insert into public.racing_settings (id) values (1)
on conflict (id) do nothing;

create trigger racing_settings_set_updated_at
before update on public.racing_settings
for each row execute function public.set_updated_at();

-- 6. RLS -----------------------------------------------------
alter table public.racing_cars           enable row level security;
alter table public.racing_tracks         enable row level security;
alter table public.user_racing_profiles  enable row level security;
alter table public.racing_deposits       enable row level security;
alter table public.racing_settings       enable row level security;

-- Cars / tracks: readable by all authenticated.
create policy "racing_cars_select_authenticated"
on public.racing_cars for select to authenticated using (true);

create policy "racing_tracks_select_authenticated"
on public.racing_tracks for select to authenticated using (true);

-- Settings: readable by all (multiplier is not sensitive).
create policy "racing_settings_select_authenticated"
on public.racing_settings for select to authenticated using (true);

-- Racing profile: own read / insert / update, admin read-all.
create policy "user_racing_profiles_select_own"
on public.user_racing_profiles for select to authenticated
using (user_id = auth.uid());

create policy "user_racing_profiles_insert_own"
on public.user_racing_profiles for insert to authenticated
with check (user_id = auth.uid());

create policy "user_racing_profiles_update_own"
on public.user_racing_profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "user_racing_profiles_select_super_admin"
on public.user_racing_profiles for select to authenticated
using (public.is_super_admin());

-- Deposits: users read their own; admins read all.
create policy "racing_deposits_select_own"
on public.racing_deposits for select to authenticated
using (user_id = auth.uid());

create policy "racing_deposits_select_super_admin"
on public.racing_deposits for select to authenticated
using (public.is_super_admin());

-- No INSERT policy for authenticated users. Deposits are written by
-- a SECURITY DEFINER RPC called from the Edge Function that receives
-- the external deposit webhook. (RPC added in a later phase.)

-- 7. Seed: 10 cars -------------------------------------------
insert into public.racing_cars
  (name, category, accent_color, top_speed_kph, sort_order)
values
  ('Formula 1',       'f1',        '#dc2626', 360, 1),
  ('Ferrari 488 GT3', 'gt',        '#e63946', 320, 2),
  ('Lamborghini GT3', 'gt',        '#f4a261', 315, 3),
  ('Porsche 911 GT3', 'gt',        '#f0e6d6', 310, 4),
  ('WRC Rally Car',   'rally',     '#2a9d8f', 220, 5),
  ('Dirt Rally Beast','dirt',      '#8b5a2b', 200, 6),
  ('Monster Truck',   'truck',     '#9d4edd', 160, 7),
  ('NASCAR Stock',    'stock',     '#457b9d', 340, 8),
  ('Formula Drift',   'drift',     '#ff006e', 280, 9),
  ('LM Hypercar',     'prototype', '#06d6a0', 350, 10);

-- 8. Seed: 3 tracks ------------------------------------------
insert into public.racing_tracks
  (name, country, path_data, total_laps, sort_order)
values
  (
    'Suzuka Circuit',
    'Japan',
    'M 100 300 C 100 150, 250 100, 400 150 L 600 200 C 750 220, 850 180, 880 300 C 900 400, 800 500, 650 500 L 400 480 C 250 470, 150 420, 100 300 Z',
    10, 1
  ),
  (
    'Nürburgring Nordschleife',
    'Germany',
    'M 120 400 C 80 350, 90 250, 180 220 C 250 200, 300 250, 380 240 C 500 220, 550 120, 680 140 C 780 160, 820 260, 780 350 C 740 440, 650 520, 520 520 C 400 520, 250 490, 120 400 Z',
    12, 2
  ),
  (
    'Abu Dhabi Marina',
    'United Arab Emirates',
    'M 150 450 C 120 380, 180 320, 260 300 L 420 260 C 520 240, 620 200, 720 240 C 820 280, 860 380, 820 460 C 780 540, 680 560, 580 540 L 380 500 C 280 480, 200 500, 150 450 Z',
    8, 3
  );
import { supabase } from '@/lib/supabase';

export type LeaderboardRange = 'daily' | 'weekly' | 'monthly' | '3mo' | '6mo' | 'yearly';

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  display_name: string;
  email: string;
  car_id: string | null;
  car_name: string | null;
  car_color: string | null;
  work_minutes: number;
  work_seconds: number;
  deposit_usd: number;
  boost_minutes: number;
  score_minutes: number;
}

export interface WeeklySnapshot {
  week_start: string;
  week_end: string;
  frozen_at: string;
  deposit_multiplier: number;
  standings: LeaderboardRow[];
}

/** Format a Date as YYYY-MM-DD in the given timezone. */
function isoDate(d: Date, tz = 'Asia/Dubai'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const day = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${day}`;
}

/** Compute (start, end) ISO dates for each range, in Dubai time. */
function rangeBounds(range: LeaderboardRange): { start: string; end: string } {
  const now = new Date();
  const end = isoDate(now);

  const start = new Date(now);
  switch (range) {
    case 'daily':
      return { start: end, end };
    case 'monthly': {
      // First of current month.
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dubai',
        year: 'numeric',
        month: '2-digit',
      }).formatToParts(now);
      const y = parts.find((p) => p.type === 'year')!.value;
      const m = parts.find((p) => p.type === 'month')!.value;
      return { start: `${y}-${m}-01`, end };
    }
    case '3mo':
      start.setUTCDate(start.getUTCDate() - 89);
      return { start: isoDate(start), end };
    case '6mo':
      start.setUTCDate(start.getUTCDate() - 179);
      return { start: isoDate(start), end };
    case 'yearly':
      start.setUTCDate(start.getUTCDate() - 364);
      return { start: isoDate(start), end };
    case 'weekly':
      // Handled separately via the snapshot RPC.
      return { start: end, end };
  }
}

export async function fetchLeaderboard(
  range: Exclude<LeaderboardRange, 'weekly'>,
): Promise<LeaderboardRow[]> {
  const { start, end } = rangeBounds(range);

  const { data, error } = await supabase.rpc('leaderboard_for_range', {
    p_start_date: start,
    p_end_date: end,
    p_limit: 100,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardRow[];
}

/**
 * Fetch the latest weekly snapshot. Triggers a freeze attempt first —
 * it's idempotent, so calling it multiple times is fine. If the current
 * week is complete (past Friday 19:30 Dubai) and no snapshot exists,
 * the freeze creates one before we read.
 */
export async function fetchWeeklySnapshot(): Promise<WeeklySnapshot | null> {
  // Best-effort freeze. Ignore errors — the read below will simply
  // return the previous snapshot if this fails.
  await supabase.rpc('freeze_weekly_leaderboard').then(
    () => undefined,
    () => undefined,
  );

  const { data, error } = await supabase.rpc('get_weekly_leaderboard');

  if (error) throw new Error(error.message);

  const rows = data as WeeklySnapshot[] | null;
  if (!rows || rows.length === 0) return null;
  return rows[0];
}
import { useEffect, useState } from 'react';

import {
  fetchLeaderboard,
  fetchWeeklySnapshot,
  type LeaderboardRange,
  type LeaderboardRow,
} from '@/features/racing/leaderboardApi';

export interface UseLeaderboardResult {
  rows: LeaderboardRow[];
  loading: boolean;
  error: string | null;
  /** Populated when range === 'weekly'. */
  weeklyWeekStart: string | null;
  weeklyWeekEnd: string | null;
}

export function useLeaderboard(
  range: LeaderboardRange,
): UseLeaderboardResult {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyWeekStart, setWeeklyWeekStart] = useState<string | null>(null);
  const [weeklyWeekEnd, setWeeklyWeekEnd] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        if (range === 'weekly') {
          const snap = await fetchWeeklySnapshot();
          if (cancelled) return;
          if (!snap) {
            setRows([]);
            setWeeklyWeekStart(null);
            setWeeklyWeekEnd(null);
          } else {
            setRows(snap.standings);
            setWeeklyWeekStart(snap.week_start);
            setWeeklyWeekEnd(snap.week_end);
          }
        } else {
          const next = await fetchLeaderboard(range);
          if (cancelled) return;
          setRows(next);
          setWeeklyWeekStart(null);
          setWeeklyWeekEnd(null);
        }
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load leaderboard.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [range]);

  return { rows, loading, error, weeklyWeekStart, weeklyWeekEnd };
}
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { todayInBusinessTz } from '@/lib/time';
import type { RacingCar, RaceParticipant } from '@/types/racing';

export interface UseRaceParticipantsResult {
  participants: RaceParticipant[];
  loading: boolean;
  error: string | null;
  /** True when the realtime channel is connected. */
  live: boolean;
  /** Manual refresh (used by fallback polling). */
  refresh: () => Promise<void>;
}

interface AttendanceRow {
  employee_id: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  total_work_minutes: number | null;
  work_date: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
}

interface RacingRow {
  user_id: string;
  car_id: string | null;
  avatar_key: string | null;
}

async function fetchParticipants(): Promise<RaceParticipant[]> {
  const today = todayInBusinessTz();

  const [attendanceRes, profilesRes, racingRes, carsRes] = await Promise.all([
    supabase
      .from('attendance_records')
      .select(
        'employee_id, clock_in_at, clock_out_at, total_work_minutes, work_date',
      )
      .eq('work_date', today),
    supabase.from('profiles').select('id, full_name, email'),
    supabase
      .from('user_racing_profiles')
      .select('user_id, car_id, avatar_key'),
    supabase
      .from('racing_cars')
      .select(
        'id, name, category, accent_color, top_speed_kph, sort_order, active',
      ),
  ]);

  if (attendanceRes.error) throw new Error(attendanceRes.error.message);
  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (racingRes.error) throw new Error(racingRes.error.message);
  if (carsRes.error) throw new Error(carsRes.error.message);

  // Open-break detection
  let openBreakUserIds = new Set<string>();
  const { data: attIdRows } = await supabase
    .from('attendance_records')
    .select('id, employee_id')
    .eq('work_date', today);

  const attendanceByEmployee = new Map<string, string>();
  for (const row of attIdRows ?? []) {
    attendanceByEmployee.set(row.employee_id, row.id);
  }

  const attendanceRowIds = Array.from(attendanceByEmployee.values());
  if (attendanceRowIds.length > 0) {
    const { data: breakRows } = await supabase
      .from('break_records')
      .select('attendance_id')
      .in('attendance_id', attendanceRowIds)
      .is('break_end_at', null);

    const openBreakAttIds = new Set(
      (breakRows ?? []).map((b) => b.attendance_id),
    );

    openBreakUserIds = new Set(
      Array.from(attendanceByEmployee.entries())
        .filter(([, attId]) => openBreakAttIds.has(attId))
        .map(([userId]) => userId),
    );
  }

  const profilesById = new Map<string, ProfileRow>(
    (profilesRes.data as ProfileRow[]).map((p) => [p.id, p]),
  );
  const racingByUser = new Map<string, RacingRow>(
    (racingRes.data as RacingRow[]).map((r) => [r.user_id, r]),
  );
  const carsById = new Map<string, RacingCar>(
    (carsRes.data as RacingCar[]).map((c) => [c.id, c]),
  );

  return (attendanceRes.data as AttendanceRow[]).map((a) => {
    const profile = profilesById.get(a.employee_id);
    const racing = racingByUser.get(a.employee_id);
    const car = racing?.car_id ? carsById.get(racing.car_id) ?? null : null;
    const onTrack = a.clock_out_at === null;
    const onPit = openBreakUserIds.has(a.employee_id);

    return {
      user_id: a.employee_id,
      display_name: profile?.full_name || 'Unnamed racer',
      email: profile?.email ?? '',
      car,
      avatar_key: racing?.avatar_key ?? null,
      work_minutes: a.total_work_minutes ?? 0,
      on_track: onTrack,
      on_pit: onPit,
      clock_in_at: a.clock_in_at,
    };
  });
}

/**
 * Fetch all participants racing today, and subscribe to realtime
 * changes on attendance_records + break_records. On any event, a
 * debounced refetch is triggered (300ms) so bursts of updates don't
 * cause a flurry of queries.
 */
export function useRaceParticipants(): UseRaceParticipantsResult {
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  // Debounce timer for realtime events.
  const debounceRef = useRef<number | null>(null);
  // Set of participant refreshes currently in flight — prevents overlap.
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const next = await fetchParticipants();
      setParticipants(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load participants.');
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await fetchParticipants();
        if (cancelled) return;
        setParticipants(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : 'Failed to load participants.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('race-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
        },
        () => {
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => {
            void load();
          }, 300);
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'break_records',
        },
        () => {
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => {
            void load();
          }, 300);
        },
      )
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED');
      });

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { participants, loading, error, live, refresh: load };
}
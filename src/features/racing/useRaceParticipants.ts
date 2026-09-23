import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { todayInBusinessTz } from '@/lib/time';
import type { RacingCar, RaceParticipant } from '@/types/racing';

export interface UseRaceParticipantsResult {
  participants: RaceParticipant[];
  loading: boolean;
  error: string | null;
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

/**
 * Fetch all participants racing today.
 *
 * Combines:
 *   - attendance_records for today (RLS scopes to what the caller may see)
 *   - profiles for display names
 *   - user_racing_profiles for car selection
 *   - racing_cars for car styling
 *
 * Live "on_track" / "on_pit" is derived from the attendance row + a
 * separate open-breaks query. (Break-state query added inline below.)
 */
export function useRaceParticipants(): UseRaceParticipantsResult {
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const today = todayInBusinessTz();

        const [attendanceRes, profilesRes, racingRes, carsRes] =
          await Promise.all([
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

        // Break state — which attendance rows currently have an open break.
        const attendanceIds = (attendanceRes.data as AttendanceRow[]).map(
          (a) => a.employee_id,
        );

        let openBreakUserIds = new Set<string>();
        if (attendanceIds.length > 0) {
          // Map employee_id → attendance_id, then query break_records.
          const attendanceByEmployee = new Map<string, string>();
          const { data: attRows } = await supabase
            .from('attendance_records')
            .select('id, employee_id')
            .eq('work_date', today);

          for (const row of attRows ?? []) {
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

        const rows: RaceParticipant[] = (
          attendanceRes.data as AttendanceRow[]
        ).map((a) => {
          const profile = profilesById.get(a.employee_id);
          const racing = racingByUser.get(a.employee_id);
          const car = racing?.car_id
            ? carsById.get(racing.car_id) ?? null
            : null;
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

        if (cancelled) return;
        setParticipants(rows);
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

  return { participants, loading, error };
}
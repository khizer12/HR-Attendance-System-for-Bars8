import { useEffect, useRef } from 'react';

import { recordLocationVerification } from '@/features/location/api';
import { getBrowserLocation } from '@/features/location/geolocation';
import type { VerificationStatus } from '@/types/location';

export interface UsePeriodicVerificationArgs {
  /** Non-null while today's attendance row exists. */
  attendanceId: string | null;
  /** Non-null once the employee has clocked out. Timer stops. */
  clockOutAt: string | null;
  /** Whether the employee's schedule requires location. */
  locationRequired: boolean;
  /** Schedule interval in minutes. Must be > 0 to activate. */
  intervalMinutes: number;
}

/**
 * While an employee is checked in on a location-required schedule, this
 * hook fires `navigator.geolocation.getCurrentPosition` every
 * `intervalMinutes` and records the outcome server-side.
 *
 * Key properties:
 *   - Never mutates attendance. Only appends to location_verifications.
 *   - Fire-and-forget. A failed verification produces a row, not a thrown
 *     exception. The page stays usable.
 *   - The server decides `verified` vs `outside_geofence` from the
 *     coordinates. The client cannot claim success.
 *   - Pauses when the tab is hidden; resumes on the next scheduled tick.
 *     Missed ticks are NOT replayed (no burst of catch-up checks).
 *   - Runs during breaks too. The audit trail records the timestamp, so
 *     an admin reviewing a pattern can cross-reference with break_records.
 *
 * Inactive when:
 *   - there is no attendance row for today,
 *   - the employee has already clocked out,
 *   - the schedule does not require location,
 *   - intervalMinutes is not a positive number.
 */
export function usePeriodicVerification({
  attendanceId,
  clockOutAt,
  locationRequired,
  intervalMinutes,
}: UsePeriodicVerificationArgs): void {
  const inFlight = useRef(false);

  const active =
    attendanceId !== null && clockOutAt === null && locationRequired;

  useEffect(() => {
    if (!active) return;
    if (!attendanceId) return;
    if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) return;

    const id = attendanceId;
    const intervalMs = Math.round(intervalMinutes * 60_000);

    const tick = () => {
      // Don't fire on hidden tabs — resumes naturally on the next interval.
      if (document.visibilityState !== 'visible') return;

      // Prevent overlap if a slow geolocation call straddles a boundary.
      if (inFlight.current) return;
      inFlight.current = true;

      void runOneVerification(id).finally(() => {
        inFlight.current = false;
      });
    };

    const handle = window.setInterval(tick, intervalMs);

    return () => {
      window.clearInterval(handle);
    };
  }, [active, attendanceId, intervalMinutes]);
}

/**
 * One verification attempt. Never throws.
 *
 * When geolocation fails, we send the corresponding absence-of-coords
 * status (permission_denied / unavailable). When it succeeds, we send
 * the raw coordinates and a placeholder status; the server overrides
 * the status based on the actual distance to the office.
 */
async function runOneVerification(attendanceId: string): Promise<void> {
  const geo = await getBrowserLocation();

  if (!geo.ok) {
    const status: VerificationStatus =
      geo.status === 'permission_denied' ? 'permission_denied' : 'unavailable';
    await safelyRecord({
      attendanceId,
      kind: 'periodic',
      status,
    });
    return;
  }

  // `status: 'verified'` here is a placeholder. The server ignores it
  // whenever coordinates are present and derives the true status from
  // the haversine distance. This is intentional and enforced by the
  // `harden_verification_status` migration.
  await safelyRecord({
    attendanceId,
    kind: 'periodic',
    status: 'verified',
    latitude: geo.latitude,
    longitude: geo.longitude,
    accuracyMeters: geo.accuracy_meters,
  });
}

async function safelyRecord(
  input: Parameters<typeof recordLocationVerification>[0],
): Promise<void> {
  try {
    await recordLocationVerification(input);
  } catch {
    // Swallow. A failed DB write here must not break the page.
    // Worst case: one verification record is skipped. Attendance is
    // never touched.
  }
}
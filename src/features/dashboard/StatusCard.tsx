import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  canClockIn,
  canClockOut,
  canEndBreak,
  canStartBreak,
  displayAttendanceState,
} from '@/features/attendance/labels';
import { LiveTimer } from '@/features/attendance/LiveTimer';
import { CarPickerModal } from '@/features/racing';
import { useRacingProfile } from '@/features/racing';
import { formatDuration, formatTime } from '@/lib/time';
import type { UseAttendanceResult } from '@/features/attendance';

interface StatusCardProps {
  attendance: UseAttendanceResult;
}

export function StatusCard({ attendance }: StatusCardProps) {
  const {
    state,
    summary,
    error,
    actionInProgress,
    clockIn,
    startBreak,
    endBreak,
    clockOut,
  } = attendance;

  const { profile: racing, save: saveRacing } = useRacingProfile();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSaving, setPickerSaving] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const display = displayAttendanceState(state);
  const isBusy = actionInProgress !== null;

  const clockInAt = summary?.clock_in_at ?? null;
  const clockOutAt = summary?.clock_out_at ?? null;
  const workMinutes = summary?.total_work_minutes ?? 0;
  const breakMinutes = summary?.total_break_minutes ?? 0;

  // If the user has no car yet, intercept "Start Race" and prompt them.
  const needsCar = racing !== null ? racing.car_id === null : true;

  async function handleStartRace() {
    if (needsCar) {
      setPickerOpen(true);
      return;
    }
    await clockIn();
  }

  async function handlePickerSave(args: { carId: string; trackId: string }) {
    setPickerSaving(true);
    setPickerError(null);
    try {
      await saveRacing({ car_id: args.carId, track_id: args.trackId });
      setPickerOpen(false);
      // After choosing a car, immediately start the race.
      await clockIn();
    } catch (e) {
      setPickerError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setPickerSaving(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-gray mb-1">
              Current status
            </p>
            <div className="flex items-center gap-3">
              <h3 className="font-heading text-xl">{display.label}</h3>
              <Badge
                variant={display.variant}
                className={state === 'ON_BREAK' ? 'animate-pulse-soft' : undefined}
              >
                {display.label}
              </Badge>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Stat label="Started" value={clockInAt ? formatTime(clockInAt) : '—'} />
          <Stat label="Parked" value={clockOutAt ? formatTime(clockOutAt) : '—'} />

          {state === 'ON_BREAK' && summary?.active_break_started_at ? (
            <LiveStat
              label="Pit duration"
              since={summary.active_break_started_at}
              tone="warning"
            />
          ) : (
            <Stat label="On track" value={formatDuration(workMinutes)} />
          )}

          {state === 'CHECKED_IN' || state === 'BACK_FROM_BREAK' ? (
            <LiveStat label="Racing for" since={clockInAt} tone="lime" />
          ) : (
            <Stat label="Pit time" value={formatDuration(breakMinutes)} />
          )}
        </dl>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="lg"
            loading={actionInProgress === 'clock_in'}
            disabled={!canClockIn(state) || isBusy}
            onClick={() => void handleStartRace()}
          >
            {actionInProgress === 'clock_in' ? 'Starting…' : 'Start Race'}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            loading={actionInProgress === 'start_break'}
            disabled={!canStartBreak(state) || isBusy}
            onClick={() => void startBreak()}
          >
            Pit Stop
          </Button>

          <Button
            variant="secondary"
            size="lg"
            loading={actionInProgress === 'end_break'}
            disabled={!canEndBreak(state) || isBusy}
            onClick={() => void endBreak()}
          >
            Resume Race
          </Button>

          <Button
            variant="outline"
            size="lg"
            loading={actionInProgress === 'clock_out'}
            disabled={!canClockOut(state) || isBusy}
            onClick={() => void clockOut()}
          >
            Park in Garage
          </Button>
        </div>
      </Card>

      {pickerOpen && (
        <CarPickerModal
          currentCarId={racing?.car_id ?? null}
          currentTrackId={racing?.track_id ?? null}
          description="Pick a car to start your first race. You can change it anytime."
          submitting={pickerSaving}
          error={pickerError}
          onClose={() => setPickerOpen(false)}
          onSave={handlePickerSave}
        />
      )}
    </>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <dt className="text-xs text-muted-gray mb-1">{label}</dt>
      <dd className="text-sm font-medium text-off-white">{value}</dd>
    </div>
  );
}

interface LiveStatProps {
  label: string;
  since: string | null;
  tone?: 'default' | 'muted' | 'lime' | 'warning';
}

function LiveStat({ label, since, tone }: LiveStatProps) {
  return (
    <div>
      <dt className="text-xs text-muted-gray mb-1">{label}</dt>
      <dd>
        <LiveTimer since={since} tone={tone} />
      </dd>
    </div>
  );
}
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

  const display = displayAttendanceState(state);
  const isBusy = actionInProgress !== null;

  const clockInAt = summary?.clock_in_at ?? null;
  const clockOutAt = summary?.clock_out_at ?? null;
  const workMinutes = summary?.total_work_minutes ?? 0;
  const breakMinutes = summary?.total_break_minutes ?? 0;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-gray mb-1">
            Current status
          </p>
          <div className="flex items-center gap-3">
            <h3 className="font-heading text-xl">{display.label}</h3>
            <Badge variant={display.variant}>{display.label}</Badge>
          </div>
        </div>
      </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Stat label="Clocked in" value={clockInAt ? formatTime(clockInAt) : '—'} />
        <Stat label="Clocked out" value={clockOutAt ? formatTime(clockOutAt) : '—'} />

        {state === 'ON_BREAK' && summary?.active_break_started_at ? (
          <LiveStat
            label="Break duration"
            since={summary.active_break_started_at}
            tone="warning"
          />
        ) : (
          <Stat label="Worked" value={formatDuration(workMinutes)} />
        )}

        {state === 'CHECKED_IN' || state === 'BACK_FROM_BREAK' ? (
          <LiveStat
            label="Working for"
            since={clockInAt}
            tone="lime"
          />
        ) : (
          <Stat label="Break" value={formatDuration(breakMinutes)} />
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
          onClick={() => void clockIn()}
        >
          {actionInProgress === 'clock_in' ? 'Getting location…' : 'Clock in'}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          loading={actionInProgress === 'start_break'}
          disabled={!canStartBreak(state) || isBusy}
          onClick={() => void startBreak()}
        >
          Start break
        </Button>

        <Button
          variant="secondary"
          size="lg"
          loading={actionInProgress === 'end_break'}
          disabled={!canEndBreak(state) || isBusy}
          onClick={() => void endBreak()}
        >
          End break
        </Button>

        <Button
          variant="outline"
          size="lg"
          loading={actionInProgress === 'clock_out'}
          disabled={!canClockOut(state) || isBusy}
          onClick={() => void clockOut()}
        >
          Clock out
        </Button>
      </div>
    </Card>
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
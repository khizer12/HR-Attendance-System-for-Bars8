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
import { formatTime } from '@/lib/time';
import type { UseAttendanceResult } from '@/features/attendance';

interface StatusCardProps {
  attendance: UseAttendanceResult;
}

export function StatusCard({ attendance }: StatusCardProps) {
  const {
    state,
    clock_in_at,
    clock_out_at,
    actionInProgress,
    clockIn,
    startBreak,
    endBreak,
    clockOut,
    error,
  } = useAttendanceSafe(attendance);

  const display = displayAttendanceState(state);

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

      <dl className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <dt className="text-xs text-muted-gray mb-1">Clocked in</dt>
          <dd className="text-sm font-medium text-off-white">
            {clock_in_at ? formatTime(clock_in_at) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-gray mb-1">Clocked out</dt>
          <dd className="text-sm font-medium text-off-white">
            {clock_out_at ? formatTime(clock_out_at) : '—'}
          </dd>
        </div>
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
          loading={actionInProgress}
          disabled={!canClockIn(state)}
          onClick={() => void clockIn()}
        >
          Clock in
        </Button>

        <Button
          variant="secondary"
          size="lg"
          disabled={!canStartBreak(state) || actionInProgress}
          onClick={() => void startBreak()}
        >
          Start break
        </Button>

        <Button
          variant="secondary"
          size="lg"
          disabled={!canEndBreak(state) || actionInProgress}
          onClick={() => void endBreak()}
        >
          End break
        </Button>

        <Button
          variant="outline"
          size="lg"
          disabled={!canClockOut(state) || actionInProgress}
          onClick={() => void clockOut()}
        >
          Clock out
        </Button>
      </div>
    </Card>
  );
}

/**
 * The stub hook (Phase 4) doesn't have all fields yet — the real hook (Phase 5)
 * will. This adapter keeps the component written against the full interface.
 */
function useAttendanceSafe(a: UseAttendanceResult) {
  return {
    ...a,
    clock_in_at: null as string | null,
    clock_out_at: null as string | null,
  };
}
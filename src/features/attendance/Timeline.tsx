import { cn } from '@/utils/cn';
import { LiveTimer } from '@/features/attendance/LiveTimer';
import { formatTime } from '@/lib/time';
import type { BreakRow, TodaySummaryRow } from '@/services/attendance/api';
import type { AttendanceState } from '@/types/attendance';

interface TimelineProps {
  state: AttendanceState;
  summary: TodaySummaryRow | null;
  breaks: BreakRow[];
}

interface TimelineEvent {
  id: string;
  at: string | null;
  label: string;
  detail?: string;
  tone: 'lime' | 'warning' | 'muted';
  /** When true, this event is "live" and should show an active timer. */
  live?: boolean;
}

function buildEvents(
  state: AttendanceState,
  summary: TodaySummaryRow | null,
  breaks: BreakRow[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (summary?.clock_in_at) {
    events.push({
      id: 'clock-in',
      at: summary.clock_in_at,
      label: 'Clocked in',
      tone: 'lime',
    });
  }

  for (const b of breaks) {
    events.push({
      id: `${b.id}-start`,
      at: b.break_start_at,
      label: 'Break started',
      tone: 'warning',
    });
    if (b.break_end_at) {
      events.push({
        id: `${b.id}-end`,
        at: b.break_end_at,
        label: 'Break ended',
        detail:
          b.duration_minutes !== null ? `${b.duration_minutes}m` : undefined,
        tone: 'muted',
      });
    } else if (state === 'ON_BREAK') {
      events.push({
        id: `${b.id}-live`,
        at: null,
        label: 'On break',
        tone: 'warning',
        live: true,
      });
    }
  }

  if (summary?.clock_out_at) {
    events.push({
      id: 'clock-out',
      at: summary.clock_out_at,
      label: 'Clocked out',
      tone: 'muted',
    });
  }

  return events;
}

export function Timeline({ state, summary, breaks }: TimelineProps) {
  const events = buildEvents(state, summary, breaks);

  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-gray py-8 text-center">
        Nothing has happened yet today. Clock in to start your day.
      </div>
    );
  }

  const activeBreakStart = summary?.active_break_started_at ?? null;

  return (
    <ol className="relative space-y-4">
      {/* Vertical line */}
      <span
        aria-hidden="true"
        className="absolute left-[5px] top-2 bottom-2 w-px bg-charcoal-3"
      />

      {events.map((e, i) => (
        <li
          key={e.id}
          style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}
          className="relative pl-6 animate-stagger-in"
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-charcoal',
              e.tone === 'lime' && 'bg-lime',
              e.tone === 'warning' && 'bg-warning',
              e.tone === 'muted' && 'bg-muted-gray',
            )}
          />
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-sm text-off-white">{e.label}</p>
              {e.detail && (
                <p className="text-xs text-muted-gray">{e.detail}</p>
              )}
            </div>
            {e.live ? (
              <LiveTimer since={activeBreakStart} tone="warning" />
            ) : e.at ? (
              <span className="text-xs text-muted-gray tabular-nums">
                {formatTime(e.at)}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
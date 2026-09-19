import { formatDuration, formatTime } from '@/lib/time';
import type { BreakRow } from '@/services/attendance/api';

interface BreakListProps {
  breaks: BreakRow[];
}

export function BreakList({ breaks }: BreakListProps) {
  if (breaks.length === 0) {
    return (
      <p className="text-sm text-muted-gray py-6 text-center">
        No breaks taken today.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-charcoal-3">
      {breaks.map((b, i) => {
        const isActive = b.break_end_at === null;
        const startLabel = formatTime(b.break_start_at);
        const endLabel = b.break_end_at ? formatTime(b.break_end_at) : 'ongoing';
        const duration =
          b.duration_minutes !== null ? formatDuration(b.duration_minutes) : '—';

        return (
          <li
            key={b.id}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div>
              <p className="text-sm text-off-white">
                Break {i + 1}
              </p>
              <p className="text-xs text-muted-gray tabular-nums">
                {startLabel} → {endLabel}
              </p>
            </div>
            <span
              className={
                isActive
                  ? 'text-xs text-warning tabular-nums'
                  : 'text-xs text-muted-gray tabular-nums'
              }
            >
              {isActive ? 'in progress' : duration}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
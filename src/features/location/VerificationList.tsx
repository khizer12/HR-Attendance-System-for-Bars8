import { Badge } from '@/components/ui/Badge';
import { formatTime, formatDateShort } from '@/lib/time';
import type { VerificationKind, VerificationStatus } from '@/types/location';
import { cn } from '@/utils/cn';

export interface VerificationRowView {
  id: string;
  kind: VerificationKind;
  status: VerificationStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  distance_meters: number | null;
  created_at: string;
  /** Only populated in the admin view. */
  work_date?: string;
}

interface VerificationListProps {
  rows: VerificationRowView[];
  /** When true, shows the work_date column (admin view). */
  showDate?: boolean;
  emptyMessage?: string;
}

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'info'
  | 'neutral';

const STATUS_DISPLAY: Record<
  VerificationStatus,
  { label: string; variant: BadgeVariant }
> = {
  verified: { label: 'Verified', variant: 'success' },
  outside_geofence: { label: 'Outside fence', variant: 'danger' },
  permission_denied: { label: 'Perm denied', variant: 'warning' },
  unavailable: { label: 'Unavailable', variant: 'warning' },
  invalid: { label: 'Invalid', variant: 'danger' },
  missed: { label: 'Missed', variant: 'warning' },
  network_error: { label: 'Network', variant: 'warning' },
};

const KIND_LABEL: Record<VerificationKind, string> = {
  clock_in: 'Clock in',
  periodic: 'Periodic',
  clock_out: 'Clock out',
  manual: 'Manual',
};

function isFlagged(status: VerificationStatus): boolean {
  return status !== 'verified';
}

function formatDistance(meters: number | null): string {
  if (meters === null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function VerificationList({
  rows,
  showDate = false,
  emptyMessage = 'No location checks recorded.',
}: VerificationListProps) {
  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-gray">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-charcoal-3">
      {rows.map((v) => {
        const display = STATUS_DISPLAY[v.status];
        const flagged = isFlagged(v.status);

        return (
          <li
            key={v.id}
            className={cn(
              'px-5 py-3 flex items-center justify-between gap-4',
              flagged && 'bg-danger/[0.03]',
            )}
          >
            <div className="min-w-0 flex items-start gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={display.variant}>{display.label}</Badge>
                  <span className="text-xs text-muted-gray">
                    {KIND_LABEL[v.kind]}
                  </span>
                </div>
                <div className="text-xs text-muted-gray mt-1 tabular-nums">
                  {showDate && v.work_date
                    ? `${v.work_date} · ${formatTime(v.created_at)}`
                    : formatDateShort(v.created_at) +
                      ' · ' +
                      formatTime(v.created_at)}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-off-white tabular-nums">
                {formatDistance(v.distance_meters)}
              </div>
              {v.accuracy_meters !== null && (
                <div className="text-[10px] text-muted-gray tabular-nums">
                  ±{Math.round(v.accuracy_meters)} m
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
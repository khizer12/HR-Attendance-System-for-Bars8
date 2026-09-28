import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import type { LeaveRequestWithMeta, LeaveStatus } from '@/types/leave';

interface LeaveRequestListProps {
  rows: LeaveRequestWithMeta[];
  emptyMessage?: string;
  showEmployee?: boolean;
  actions?: (row: LeaveRequestWithMeta) => React.ReactNode;
}

const STATUS_DISPLAY: Record<
  LeaveStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'muted' | 'neutral' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'muted' },
};

function dayCount(start: string, end: string): number {
  return (
    Math.floor(
      (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
    ) + 1
  );
}

export function LeaveRequestList({
  rows,
  emptyMessage = 'No leave requests yet.',
  showEmployee = false,
  actions,
}: LeaveRequestListProps) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-gray">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-charcoal-3">
      {rows.map((r) => {
        const status = STATUS_DISPLAY[r.status];
        const days = dayCount(r.start_date, r.end_date);

        return (
          <li key={r.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: r.leave_type_color }}
                  />
                  <span className="text-sm text-off-white">
                    {r.leave_type_name}
                  </span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                {showEmployee && (
                  <p className="text-xs text-muted-gray mt-1">
                    {r.employee_full_name} · {r.employee_email}
                  </p>
                )}
                <p className="text-xs text-muted-gray mt-1 tabular-nums">
                  {r.start_date} → {r.end_date} · {days}{' '}
                  {days === 1 ? 'day' : 'days'}
                </p>
                <p className="text-xs text-off-white mt-2 whitespace-pre-wrap">
                  {r.reason}
                </p>
                {r.decision_note && (
                  <p
                    className={cn(
                      'text-xs mt-2 italic',
                      r.status === 'approved' ? 'text-success' : 'text-danger',
                    )}
                  >
                    Admin note: {r.decision_note}
                  </p>
                )}
              </div>

              {actions && <div className="shrink-0">{actions(r)}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
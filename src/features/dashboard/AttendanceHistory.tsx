import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { displayAttendanceStatus } from '@/features/attendance/labels';
import { formatDuration, formatTime } from '@/lib/time';
import { DASHBOARD_HISTORY_LIMIT } from '@/lib/constants';
import type { AttendanceRecord } from '@/types/attendance';

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  loading?: boolean;
}

export function AttendanceHistory({
  records,
  loading = false,
}: AttendanceHistoryProps) {
  const visible = records.slice(0, DASHBOARD_HISTORY_LIMIT);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent attendance</CardTitle>
        <p className="text-xs text-muted-gray mt-1">
          Last {DASHBOARD_HISTORY_LIMIT} days
        </p>
      </CardHeader>
      <CardBody className="p-0">
        {loading && visible.length === 0 ? (
          <div className="px-5 py-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-gray">
              No attendance records yet.
            </p>
            <p className="text-xs text-muted-gray mt-1">
              Your history will appear here once you clock in.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-charcoal-3">
            {visible.map((r, i) => {
              const statusDisplay = displayAttendanceStatus(r.status);
              return (
                <li
                  key={r.id}
                  style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                  className="px-5 py-3 flex items-center justify-between gap-4 animate-stagger-in"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-off-white truncate">
                      {r.work_date}
                    </p>
                    <p className="text-xs text-muted-gray">
                      {r.clock_in_at ? formatTime(r.clock_in_at) : '—'}
                      {' → '}
                      {r.clock_out_at ? formatTime(r.clock_out_at) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-gray">
                      {r.total_work_minutes !== null
                        ? formatDuration(r.total_work_minutes)
                        : '—'}
                    </span>
                    {statusDisplay && (
                      <Badge variant={statusDisplay.variant}>
                        {statusDisplay.label}
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
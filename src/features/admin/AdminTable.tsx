import { Badge } from '@/components/ui/Badge';
import { LiveTimer } from '@/features/attendance';
import { displayAttendanceState } from '@/features/attendance/labels';
import { formatDuration, formatTime } from '@/lib/time';
import { cn } from '@/utils/cn';
import type { AdminOverviewRow } from '@/features/admin';

interface AdminTableProps {
  rows: AdminOverviewRow[];
}

export function AdminTable({ rows }: AdminTableProps) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted-gray">
          No employees match this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-gray border-b border-charcoal-3">
            <th scope="col" className="font-medium py-2.5 pr-3">
              Employee
            </th>
            <th scope="col" className="font-medium py-2.5 pr-3">
              Status
            </th>
            <th scope="col" className="font-medium py-2.5 pr-3 tabular-nums">
              Clock in
            </th>
            <th scope="col" className="font-medium py-2.5 pr-3 tabular-nums">
              Clock out
            </th>
            <th scope="col" className="font-medium py-2.5 pr-3 tabular-nums">
              Worked
            </th>
            <th
              scope="col"
              className="font-medium py-2.5 tabular-nums hidden md:table-cell"
            >
              Break
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const display = displayAttendanceState(r.state);
            const isOnBreak = r.state === 'ON_BREAK';
            const isWorking =
              r.state === 'CHECKED_IN' || r.state === 'BACK_FROM_BREAK';

            return (
              <tr
                key={r.employee_id}
                className="border-b border-charcoal-3/60 last:border-0 hover:bg-charcoal-2/40 transition-colors"
              >
                <td className="py-3 pr-3">
                  <div className="min-w-0">
                    <div className="text-off-white truncate">
                      {r.full_name || 'Unnamed user'}
                    </div>
                    <div className="text-xs text-muted-gray truncate">
                      {r.email}
                    </div>
                  </div>
                </td>

                <td className="py-3 pr-3">
                  <Badge variant={display.variant}>{display.label}</Badge>
                </td>

                <td className="py-3 pr-3 tabular-nums text-off-white">
                  {r.clock_in_at ? formatTime(r.clock_in_at) : '—'}
                </td>

                <td className="py-3 pr-3 tabular-nums text-off-white">
                  {r.clock_out_at ? formatTime(r.clock_out_at) : '—'}
                </td>

                <td className="py-3 pr-3 tabular-nums">
                  {isWorking && r.clock_in_at ? (
                    <LiveTimer
                      since={r.clock_in_at}
                      tone="lime"
                      className={cn('text-xs')}
                    />
                  ) : r.total_work_minutes !== null ? (
                    <span className="text-off-white text-xs">
                      {formatDuration(r.total_work_minutes)}
                    </span>
                  ) : (
                    <span className="text-muted-gray text-xs">—</span>
                  )}
                </td>

                <td className="py-3 tabular-nums hidden md:table-cell">
                  {isOnBreak && r.active_break_started_at ? (
                    <LiveTimer
                      since={r.active_break_started_at}
                      tone="warning"
                      className={cn('text-xs')}
                    />
                  ) : r.total_break_minutes !== null ? (
                    <span className="text-off-white text-xs">
                      {formatDuration(r.total_break_minutes)}
                    </span>
                  ) : (
                    <span className="text-muted-gray text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
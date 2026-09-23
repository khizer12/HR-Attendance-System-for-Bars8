import { useMemo } from 'react';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { displayAttendanceState } from '@/features/attendance/labels';
import { useAdminOverview } from '@/features/admin';
import { useEmployees } from '@/features/employees';
import { useSchedules } from '@/features/schedules';
import { BUSINESS_TIMEZONE } from '@/lib/constants';

const DOW_BY_SHORT_NAME: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function todayDowInBusinessTz(): number {
  const shortName = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIMEZONE,
    weekday: 'short',
  }).format(new Date());
  return DOW_BY_SHORT_NAME[shortName] ?? 0;
}

export function TodayRoster() {
  const overview = useAdminOverview();
  const employees = useEmployees();
  const schedules = useSchedules();

  const dow = todayDowInBusinessTz();

  const scheduled = useMemo(() => {
    const scheduleIdByEmp = new Map(
      employees.rows.map((e) => [e.id, e.schedule_id] as const),
    );
    const scheduleById = new Map(
      schedules.schedules.map((s) => [s.id, s] as const),
    );

    return overview.rows.flatMap((r) => {
      const sid = scheduleIdByEmp.get(r.employee_id);
      if (!sid) return [];
      const sch = scheduleById.get(sid);
      if (!sch || !sch.active) return [];
      if (!sch.working_days.includes(dow)) return [];
      return [
        {
          employee_id: r.employee_id,
          full_name: r.full_name,
          email: r.email,
          department: r.department,
          state: r.state,
        },
      ];
    });
  }, [overview.rows, employees.rows, schedules.schedules, dow]);

  const isLoading =
    overview.loading || employees.loading || schedules.loading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s roster</CardTitle>
        <p className="text-xs text-muted-gray mt-1">
          Employees scheduled to work today
        </p>
      </CardHeader>
      <CardBody className="p-0">
                {isLoading && overview.rows.length === 0 ? (
          <div className="px-5 py-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : scheduled.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-gray">
              No employees are scheduled to work today.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-charcoal-3">
            {scheduled.map((r, i) => {
              const display = displayAttendanceState(r.state);
              return (
                <li
                  key={r.employee_id}
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                  className="px-5 py-3 flex items-center justify-between gap-3 animate-stagger-in"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-off-white truncate">
                      {r.full_name || 'Unnamed user'}
                    </div>
                    <div className="text-xs text-muted-gray truncate">
                      {r.department ?? r.email}
                    </div>
                  </div>
                  <Badge variant={display.variant}>{display.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
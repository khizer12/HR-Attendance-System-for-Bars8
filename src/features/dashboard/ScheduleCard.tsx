import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/features/auth';
import {
  formatTimeOfDay,
  formatWorkingDays,
  useSchedule,
} from '@/features/schedules';
import { BUSINESS_TIMEZONE } from '@/lib/constants';
import { formatDateLong } from '@/lib/time';

export function ScheduleCard() {
  const { profile } = useAuth();
  const { schedule, loading } = useSchedule(profile?.schedule_id ?? undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s schedule</CardTitle>
        <p className="text-xs text-muted-gray mt-1">{formatDateLong()}</p>
      </CardHeader>
      <CardBody className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-gray">Loading schedule…</p>
        ) : !schedule ? (
          <div className="py-2">
            <p className="text-sm text-muted-gray">
              No schedule assigned.
            </p>
            <p className="text-xs text-muted-gray mt-1">
              Ask your administrator to assign one.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-gray">Working hours</span>
              <span className="text-sm font-medium text-off-white">
                {formatTimeOfDay(schedule.start_time)} –{' '}
                {formatTimeOfDay(schedule.end_time)}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-gray">Working days</span>
              <span className="text-sm font-medium text-off-white">
                {formatWorkingDays(schedule.working_days)}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-gray">Grace period</span>
              <span className="text-sm font-medium text-off-white">
                {schedule.grace_period_minutes} min
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-gray">Timezone</span>
              <span className="text-sm font-medium text-off-white">
                {BUSINESS_TIMEZONE}
              </span>
            </div>

            <div className="pt-2 border-t border-charcoal-3">
              <p className="text-xs text-muted-gray">
                {schedule.name}
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
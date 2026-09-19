import { useAuth } from '@/features/auth';
import { TodayRoster } from '@/features/admin';
import {
  SchedulesList,
  formatTimeOfDay,
  formatWorkingDays,
  useSchedule,
} from '@/features/schedules';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDateLong } from '@/lib/time';

export default function Schedule() {
  const { profile, isSuperAdmin, isSubAdmin } = useAuth();

  if (isSuperAdmin || isSubAdmin) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
        <div>
          <h2 className="font-heading text-2xl">Schedules</h2>
          <p className="text-muted-gray text-sm mt-1">
            Define working hours, days, and rules. Assign them to employees from
            their detail page.
          </p>
        </div>

        <TodayRoster />

        <SchedulesList />
      </div>
    );
  }

  return <EmployeeSchedule scheduleId={profile?.schedule_id ?? undefined} />;
}

function EmployeeSchedule({ scheduleId }: { scheduleId: string | undefined }) {
  const { schedule, loading } = useSchedule(scheduleId);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h2 className="font-heading text-2xl">Your schedule</h2>
        <p className="text-muted-gray text-sm mt-1">{formatDateLong()}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{schedule?.name ?? 'Schedule'}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-gray">Loading…</p>
          ) : !schedule ? (
            <p className="text-sm text-muted-gray">
              No schedule assigned. Contact your administrator.
            </p>
          ) : (
            <>
              <Row
                label="Working hours"
                value={`${formatTimeOfDay(schedule.start_time)} – ${formatTimeOfDay(schedule.end_time)}`}
              />
              <Row
                label="Working days"
                value={formatWorkingDays(schedule.working_days)}
              />
              <Row
                label="Grace period"
                value={`${schedule.grace_period_minutes} min`}
              />
              <Row
                label="Break required"
                value={schedule.break_required ? 'Yes' : 'No'}
              />
              {schedule.break_required && (
                <Row
                  label="Break range"
                  value={
                    schedule.min_break_minutes !== null ||
                    schedule.max_break_minutes !== null
                      ? `${schedule.min_break_minutes ?? '—'} – ${schedule.max_break_minutes ?? '—'} min`
                      : 'Not specified'
                  }
                />
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-muted-gray">{label}</span>
      <span className="text-sm font-medium text-off-white">{value}</span>
    </div>
  );
}
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAttendanceContext } from '@/features/attendance';
import { useAuth } from '@/features/auth';
import { VerificationList } from '@/features/location';
import { useVerificationsForAttendance } from '@/features/location/useVerificationsForAttendance';
import { useSchedule } from '@/features/schedules';

/**
 * Renders only when the employee is on a location-required schedule.
 * Otherwise returns null — no empty card for the majority of users.
 */
export function EmployeeVerificationsCard() {
  const { profile } = useAuth();
  const { schedule } = useSchedule(profile?.schedule_id ?? undefined);
  const { summary } = useAttendanceContext();
  const { rows, loading } = useVerificationsForAttendance(
    summary?.attendance_id ?? null,
  );

  if (!schedule?.location_required) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s location checks</CardTitle>
        <p className="text-xs text-muted-gray mt-1">
          Recorded automatically while you are clocked in.
        </p>
      </CardHeader>
      <CardBody className="p-0">
        {loading && rows.length === 0 ? (
          <div className="px-5 py-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
          <VerificationList
            rows={rows}
            emptyMessage="No checks recorded yet today."
          />
        )}
      </CardBody>
    </Card>
  );
}
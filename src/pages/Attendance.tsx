import { useAuth } from '@/features/auth';
import { BreakList, Timeline } from '@/features/attendance';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusCard } from '@/features/dashboard';
import { formatDateLong } from '@/lib/time';
import { useAttendanceContext } from '@/features/attendance';

export default function Attendance() {
  const { profile } = useAuth();
  const attendance = useAttendanceContext();

  const todayLabel = formatDateLong();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <h2 className="font-heading text-2xl">Attendance</h2>
        <p className="text-muted-gray text-sm mt-1">{todayLabel}</p>
      </div>

      {profile && (
        <StatusCard attendance={attendance} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s timeline</CardTitle>
          </CardHeader>
          <CardBody>
            <Timeline
              state={attendance.state}
              summary={attendance.summary}
              breaks={attendance.breaks}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breaks today</CardTitle>
            <p className="text-xs text-muted-gray mt-1">
              {attendance.breaks.length} break
              {attendance.breaks.length === 1 ? '' : 's'} recorded
            </p>
          </CardHeader>
          <CardBody className="py-2">
            <BreakList breaks={attendance.breaks} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
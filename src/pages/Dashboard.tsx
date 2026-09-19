import { useAuth } from '@/features/auth';
import { useAttendance } from '@/features/attendance';
import {
  AttendanceHistory,
  QuickStats,
  ScheduleCard,
  StatusCard,
} from '@/features/dashboard';
import { formatDateLong, greetingForNow } from '@/lib/time';

export default function Dashboard() {
  const { profile } = useAuth();
  const attendance = useAttendance();

  const greeting = greetingForNow();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'there';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl">
          {greeting}, {firstName}
        </h2>
        <p className="text-muted-gray text-sm mt-1">{formatDateLong()}</p>
      </div>

      {/* Primary grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <StatusCard attendance={attendance} />
          <QuickStats
            workedMinutes={0}
            breakMinutes={0}
            status={null}
          />
        </div>

        <div>
          <ScheduleCard />
        </div>
      </div>

      {/* History */}
      <AttendanceHistory records={attendance.history} />
    </div>
  );
}
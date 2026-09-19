import { useAuth } from '@/features/auth';
import { useAttendance } from '@/features/attendance';
import { AdminDashboard } from '@/features/admin';
import {
  AttendanceHistory,
  QuickStats,
  ScheduleCard,
  StatusCard,
} from '@/features/dashboard';
import { formatDateLong, greetingForNow } from '@/lib/time';

export default function Dashboard() {
  const { profile, isSuperAdmin, isSubAdmin } = useAuth();

  // Admins and sub-admins see the team overview on /dashboard.
  if (isSuperAdmin || isSubAdmin) {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard profile={profile} />;
}

/**
 * The original employee view is preserved verbatim.
 * Only path to it now is via the employee role.
 */
function EmployeeDashboard({
  profile,
}: {
  profile: ReturnType<typeof useAuth>['profile'];
}) {
  const attendance = useAttendance();

  const greeting = greetingForNow();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'there';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <h2 className="font-heading text-2xl">
          {greeting}, {firstName}
        </h2>
        <p className="text-muted-gray text-sm mt-1">{formatDateLong()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <StatusCard attendance={attendance} />
          <QuickStats
            workedMinutes={attendance.summary?.total_work_minutes ?? 0}
            breakMinutes={attendance.summary?.total_break_minutes ?? 0}
            status={attendance.summary?.status ?? null}
          />
        </div>

        <div>
          <ScheduleCard />
        </div>
      </div>

      <AttendanceHistory records={attendance.history} />
    </div>
  );
}
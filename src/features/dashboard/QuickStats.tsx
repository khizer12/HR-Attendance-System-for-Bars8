import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { displayAttendanceStatus } from '@/features/attendance/labels';
import { formatDuration } from '@/lib/time';
import type { AttendanceStatus } from '@/types/attendance';

interface QuickStatsProps {
  workedMinutes: number;
  breakMinutes: number;
  status: AttendanceStatus | null;
}

export function QuickStats({ workedMinutes, breakMinutes, status }: QuickStatsProps) {
  const statusDisplay = displayAttendanceStatus(status);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Worked today" value={formatDuration(workedMinutes)} />
      <StatCard label="Break time" value={formatDuration(breakMinutes)} />
      <Card className="p-4">
        <p className="text-xs text-muted-gray mb-2">Status</p>
        <div>
          {statusDisplay ? (
            <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
          ) : (
            <span className="text-sm font-medium text-muted-gray">—</span>
          )}
        </div>
      </Card>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-gray mb-2">{label}</p>
      <p className="font-heading text-2xl font-semibold text-off-white">
        {value}
      </p>
    </Card>
  );
}
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { VerificationList } from '@/features/location/VerificationList';
import { useVerificationsForAttendance } from '@/features/location/useVerificationsForAttendance';

interface VerificationCardProps {
  attendanceId: string | null;
}

export function VerificationCard({ attendanceId }: VerificationCardProps) {
  const { rows, loading, error } = useVerificationsForAttendance(attendanceId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location checks</CardTitle>
        <p className="text-xs text-muted-gray mt-1">
          Recorded automatically while you are clocked in.
        </p>
      </CardHeader>
      <CardBody className="p-0">
        {loading && rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-gray">
            Loading…
          </div>
        ) : error ? (
          <div className="px-5 py-4">
            <p className="text-xs text-danger">{error}</p>
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
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { VerificationList } from '@/features/location/VerificationList';
import { useRecentVerifications } from '@/features/location/useRecentVerifications';

interface EmployeeVerificationLogProps {
  employeeId: string;
}

export function EmployeeVerificationLog({
  employeeId,
}: EmployeeVerificationLogProps) {
  const { rows, loading, error } = useRecentVerifications(employeeId, 30);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location checks</CardTitle>
        <p className="text-xs text-muted-gray mt-1">
          Last 30 verifications. Flagged rows are highlighted.
        </p>
      </CardHeader>
      <CardBody className="p-0">
        {loading && rows.length === 0 ? (
          <div className="px-5 py-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : error ? (
          <div className="px-5 py-4">
            <p className="text-xs text-danger">{error}</p>
          </div>
        ) : (
          <VerificationList
            rows={rows}
            showDate
            emptyMessage="No location checks recorded for this employee."
          />
        )}
      </CardBody>
    </Card>
  );
}
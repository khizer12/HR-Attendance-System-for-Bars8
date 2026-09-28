import { Link } from 'react-router-dom';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAdminLeaveRequests } from '@/features/leaves';
import { formatDateShort } from '@/lib/time';

/**
 * Dashboard widget: shows the most recent pending leave requests
 * for admins. Reuses the same hook as the full approval panel.
 *
 * Only meant to be mounted for super_admin / sub_admin users.
 */
export function PendingApprovalsCard() {
  const { rows, loading, error } = useAdminLeaveRequests('pending');
  const visible = rows.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Pending approvals</CardTitle>
          <p className="text-xs text-muted-gray mt-1">
            {loading
              ? 'Loading…'
              : rows.length === 0
                ? 'All caught up'
                : `${rows.length} ${rows.length === 1 ? 'request' : 'requests'} waiting`}
          </p>
        </div>
        <Link
          to="/leaves"
          className="text-xs text-muted-gray hover:text-off-white transition-colors"
        >
          Review →
        </Link>
      </CardHeader>
      <CardBody className="p-0">
        {error ? (
          <div className="px-5 py-4">
            <p className="text-xs text-danger">{error}</p>
          </div>
        ) : loading && visible.length === 0 ? (
          <div className="px-5 py-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-muted-gray">
              No leave requests waiting for your approval.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-charcoal-3">
            {visible.map((r) => (
              <li key={r.id} className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: r.leave_type_color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-off-white truncate">
                      {r.employee_full_name}
                    </p>
                    <p className="text-xs text-muted-gray truncate">
                      {r.leave_type_name} · {formatDateShort(r.start_date)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
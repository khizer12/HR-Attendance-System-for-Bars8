import { useMemo, useState } from 'react';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  AdminFilters,
  AdminStats,
  AdminTable,
  countByFilter,
  filterRows,
  useAdminOverview,
  type AdminFilter,
} from '@/features/admin';
import { formatTimeLong } from '@/lib/time';

export function AdminDashboard() {
  const { rows, loading, error, lastUpdated, refresh } = useAdminOverview();
  const [filter, setFilter] = useState<AdminFilter>('all');

  const counts = useMemo(() => countByFilter(rows), [rows]);
  const visible = useMemo(() => filterRows(rows, filter), [rows, filter]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl">Team overview</h2>
          <p className="text-muted-gray text-sm mt-1">
            {lastUpdated
              ? `Updated at ${formatTimeLong(lastUpdated)}`
              : 'Loading live data…'}
            {' · '}
            Auto-refreshes every 30s
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refresh()}
          disabled={loading}
        >
          Refresh now
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}

      <AdminStats rows={rows} />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Employees</CardTitle>
          <AdminFilters
            current={filter}
            onChange={setFilter}
            counts={counts}
          />
        </CardHeader>
                <CardBody className="p-0">
          {loading && rows.length === 0 ? (
            <div className="px-5 py-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : (
            <div className="px-5 pb-2">
              <AdminTable rows={visible} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
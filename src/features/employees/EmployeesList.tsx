import { useMemo, useState } from 'react';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth';
import {
  CreateEmployeeModal,
  EmployeesFilters,
  EmployeesTable,
  countEmployeesByFilter,
  filterEmployees,
  searchEmployees,
  setEmployeeActive,
  useEmployees,
  type EmployeeFilter,
  type EmployeeRow,
} from '@/features/employees';

export function EmployeesList() {
  const { isSuperAdmin } = useAuth();
  const { rows, loading, error, refresh } = useEmployees();
  const [filter, setFilter] = useState<EmployeeFilter>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useMemo(() => countEmployeesByFilter(rows), [rows]);
  const visible = useMemo(
    () => searchEmployees(filterEmployees(rows, filter), query),
    [rows, filter, query],
  );

  async function handleToggleActive(row: EmployeeRow) {
    setActionError(null);

    if (row.active) {
      const confirmed = window.confirm(
        `Disable ${row.full_name || row.email}?\n\n` +
          'They will no longer be able to sign in. Their historical ' +
          'attendance will be preserved.',
      );
      if (!confirmed) return;
    }

    setBusyId(row.id);
    try {
      await setEmployeeActive(row.id, !row.active);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Search name, email, or department"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search employees"
            />
          </div>

          {isSuperAdmin && (
            <Button
              variant="primary"
              onClick={() => setCreateOpen(true)}
              className="ml-auto"
            >
              Add employee
            </Button>
          )}
        </div>

        {(error || actionError) && (
          <div
            role="alert"
            className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
          >
            {error ?? actionError}
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Employees</CardTitle>
            <EmployeesFilters
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
              </div>
            ) : (
              <div className="px-5 pb-2">
                <EmployeesTable
                  rows={visible}
                  onToggleActive={handleToggleActive}
                  busyId={busyId}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <CreateEmployeeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void refresh()}
      />
    </>
  );
}
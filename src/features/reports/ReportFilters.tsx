import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { EmployeeRow } from '@/features/employees';
import type { ReportStatusFilter } from '@/features/reports';

export interface ReportFilterState {
  startDate: string;
  endDate: string;
  employeeId: string;
  status: ReportStatusFilter;
}

interface ReportFiltersBarProps {
  value: ReportFilterState;
  onChange: (next: ReportFilterState) => void;
  employees: EmployeeRow[];
  loading: boolean;
  onRun: () => void;
  onClear: () => void;
  canExport: boolean;
  onExport: () => void;
}

export function ReportFiltersBar({
  value,
  onChange,
  employees,
  loading,
  onRun,
  onClear,
  canExport,
  onExport,
}: ReportFiltersBarProps) {
  function update<K extends keyof ReportFilterState>(
    key: K,
    v: ReportFilterState[K],
  ) {
    onChange({ ...value, [key]: v });
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label="From"
            type="date"
            value={value.startDate}
            onChange={(e) => update('startDate', e.target.value)}
            disabled={loading}
          />
          <Input
            label="To"
            type="date"
            value={value.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            disabled={loading}
          />
          <div>
            <label
              htmlFor="report-employee"
              className="block text-xs font-medium text-off-white mb-1.5"
            >
              Employee
            </label>
            <select
              id="report-employee"
              value={value.employeeId}
              onChange={(e) => update('employeeId', e.target.value)}
              disabled={loading}
              className="w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3 border border-charcoal-3 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60 disabled:opacity-50"
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name || e.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="report-status"
              className="block text-xs font-medium text-off-white mb-1.5"
            >
              Status
            </label>
            <select
              id="report-status"
              value={value.status ?? ''}
              onChange={(e) =>
                update(
                  'status',
                  (e.target.value === ''
                    ? null
                    : (e.target.value as ReportStatusFilter)) as ReportStatusFilter,
                )
              }
              disabled={loading}
              className="w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3 border border-charcoal-3 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60 disabled:opacity-50"
            >
              <option value="">All statuses</option>
              <option value="on_time">On time</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={onRun} loading={loading}>
            Run report
          </Button>
          <Button variant="ghost" onClick={onClear} disabled={loading}>
            Clear
          </Button>
          <Button
            variant="secondary"
            onClick={onExport}
            disabled={!canExport || loading}
            className="ml-auto"
          >
            Export CSV
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
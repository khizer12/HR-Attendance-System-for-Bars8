import { useMemo, useState } from 'react';

import { useEmployees } from '@/features/employees';
import { useReport } from '@/features/reports';
import { downloadCsv, rowsToCsv } from '@/features/reports';
import { ReportFiltersBar, type ReportFilterState } from '@/features/reports/ReportFilters';
import { ReportTable } from '@/features/reports/ReportTable';
import { todayInBusinessTz } from '@/lib/time';

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const today = useMemo(() => todayInBusinessTz(), []);
  const employees = useEmployees();
  const report = useReport();

  const [filters, setFilters] = useState<ReportFilterState>(() => ({
    startDate: shiftDate(today, -29),
    endDate: shiftDate(today, -1),
    employeeId: '',
    status: null,
  }));

  function runReport() {
    void report.run({
      startDate: filters.startDate,
      endDate: filters.endDate,
      employeeId: filters.employeeId || null,
      status: filters.status,
    });
  }

  function handleExport() {
    const csv = rowsToCsv(report.rows);
    downloadCsv(
      `attendance-${filters.startDate}_to_${filters.endDate}.csv`,
      csv,
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h2 className="font-heading text-2xl">Reports</h2>
        <p className="text-muted-gray text-sm mt-1">
          Filter by date range, employee, and status. Export to CSV for Excel.
        </p>
      </div>

      <ReportFiltersBar
        value={filters}
        onChange={setFilters}
        employees={employees.rows}
        loading={report.loading}
        onRun={runReport}
        onClear={() => {
          report.clear();
          setFilters({
            startDate: shiftDate(today, -29),
            endDate: shiftDate(today, -1),
            employeeId: '',
            status: null,
          });
        }}
        canExport={report.rows.length > 0}
        onExport={handleExport}
      />

      <ReportTable
        rows={report.rows}
        loading={report.loading}
        loaded={report.loaded}
        error={report.error}
      />
    </div>
  );
}
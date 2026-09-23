import { useState } from 'react';
import { AuditLogTable } from '@/features/audit/AuditLogTable';
import { useAuditLogs } from '@/features/audit/useAuditLogs';

const ACTION_FILTERS = [
  { value: '', label: 'All actions' },
  { value: 'profile', label: 'Profiles' },
  { value: 'schedule', label: 'Schedules' },
  { value: 'office_location', label: 'Office locations' },
];

const TABLE_FILTERS = [
  { value: '', label: 'All tables' },
  { value: 'profiles', label: 'profiles' },
  { value: 'schedules', label: 'schedules' },
  { value: 'office_locations', label: 'office_locations' },
];

export function AuditLogPage() {
  const [actionPrefix, setActionPrefix] = useState('');
  const [targetTable, setTargetTable] = useState('');

  const { rows, loading, error } = useAuditLogs({
    actionPrefix: actionPrefix || undefined,
    targetTable: targetTable || undefined,
    limit: 200,
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <h2 className="font-heading text-2xl">Audit log</h2>
        <p className="text-muted-gray text-sm mt-1">
          Every security-relevant change to profiles, schedules, and office
          locations. Append-only — nothing here can be edited or deleted.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="audit-action"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Action category
          </label>
          <select
            id="audit-action"
            value={actionPrefix}
            onChange={(e) => setActionPrefix(e.target.value)}
            className="w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3 border border-charcoal-3 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60"
          >
            {ACTION_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="audit-table"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Target table
          </label>
          <select
            id="audit-table"
            value={targetTable}
            onChange={(e) => setTargetTable(e.target.value)}
            className="w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3 border border-charcoal-3 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60"
          >
            {TABLE_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <div className="w-full text-xs text-muted-gray">
            Showing up to 200 entries, newest first.
          </div>
        </div>
      </div>

      <AuditLogTable rows={rows} loading={loading} error={error} />
    </div>
  );
}
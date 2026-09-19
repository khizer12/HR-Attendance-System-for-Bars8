import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { roleLabel } from '@/features/employees/filters';
import type { EmployeeRow } from '@/features/employees/api';

interface EmployeesTableProps {
  rows: EmployeeRow[];
  onToggleActive: (row: EmployeeRow) => void;
  busyId: string | null;
}

function roleBadgeVariant(role: EmployeeRow['role']) {
  switch (role) {
    case 'super_admin':
      return 'lime' as const;
    case 'sub_admin':
      return 'info' as const;
    case 'employee':
      return 'neutral' as const;
  }
}

export function EmployeesTable({
  rows,
  onToggleActive,
  busyId,
}: EmployeesTableProps) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted-gray">No employees match this filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-gray border-b border-charcoal-3">
            <th scope="col" className="font-medium py-2.5 pr-3">Employee</th>
            <th scope="col" className="font-medium py-2.5 pr-3">Role</th>
            <th scope="col" className="font-medium py-2.5 pr-3 hidden md:table-cell">
              Department
            </th>
            <th scope="col" className="font-medium py-2.5 pr-3">Status</th>
            <th scope="col" className="font-medium py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isBusy = busyId === r.id;
            return (
              <tr
                key={r.id}
                className="border-b border-charcoal-3/60 last:border-0 hover:bg-charcoal-2/40 transition-colors"
              >
                <td className="py-3 pr-3">
                  <div className="min-w-0">
                    <Link
                      to={`/employees/${r.id}`}
                      className="text-off-white hover:text-lime transition-colors truncate block"
                    >
                      {r.full_name || 'Unnamed user'}
                    </Link>
                    <div className="text-xs text-muted-gray truncate">
                      {r.email}
                    </div>
                  </div>
                </td>

                <td className="py-3 pr-3">
                  <Badge variant={roleBadgeVariant(r.role)}>
                    {roleLabel(r.role)}
                  </Badge>
                </td>

                <td className="py-3 pr-3 hidden md:table-cell">
                  {r.department ? (
                    <span className="text-off-white text-xs">{r.department}</span>
                  ) : (
                    <span className="text-muted-gray text-xs">—</span>
                  )}
                </td>

                <td className="py-3 pr-3">
                  <Badge variant={r.active ? 'success' : 'muted'}>
                    {r.active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                <td className="py-3 text-right">
                  <Button
                    variant={r.active ? 'ghost' : 'secondary'}
                    size="sm"
                    loading={isBusy}
                    onClick={() => onToggleActive(r)}
                    className={cn(!r.active && 'text-lime')}
                  >
                    {r.active ? 'Disable' : 'Enable'}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
import type { Role } from '@/types/auth';
import type { EmployeeRow } from '@/features/employees/api';

export type EmployeeFilter =
  | 'all'
  | 'active'
  | 'inactive'
  | 'super_admin'
  | 'sub_admin'
  | 'employee';

export function filterEmployees(
  rows: EmployeeRow[],
  filter: EmployeeFilter,
): EmployeeRow[] {
  switch (filter) {
    case 'all':
      return rows;
    case 'active':
      return rows.filter((r) => r.active);
    case 'inactive':
      return rows.filter((r) => !r.active);
    case 'super_admin':
      return rows.filter((r) => r.role === 'super_admin');
    case 'sub_admin':
      return rows.filter((r) => r.role === 'sub_admin');
    case 'employee':
      return rows.filter((r) => r.role === 'employee');
  }
}

export function countEmployeesByFilter(
  rows: EmployeeRow[],
): Record<EmployeeFilter, number> {
  return {
    all: rows.length,
    active: rows.filter((r) => r.active).length,
    inactive: rows.filter((r) => !r.active).length,
    super_admin: rows.filter((r) => r.role === 'super_admin').length,
    sub_admin: rows.filter((r) => r.role === 'sub_admin').length,
    employee: rows.filter((r) => r.role === 'employee').length,
  };
}

export function roleLabel(role: Role): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'sub_admin':
      return 'Sub Admin';
    case 'employee':
      return 'Employee';
  }
}

/** Simple search across name + email + department. Case-insensitive. */
export function searchEmployees(rows: EmployeeRow[], query: string): EmployeeRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.department ?? '').toLowerCase().includes(q),
  );
}
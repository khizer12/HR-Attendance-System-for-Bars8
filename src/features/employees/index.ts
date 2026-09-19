export {
  createEmployee,
  getEmployeeById,
  listEmployees,
  setEmployeeActive,
  updateEmployee,
} from '@/features/employees/api';
export type {
  CreateEmployeeInput,
  EmployeeRow,
  UpdateEmployeeInput,
} from '@/features/employees/api';

export { useEmployees } from '@/features/employees/useEmployees';
export type { UseEmployeesResult } from '@/features/employees/useEmployees';

export { useEmployee } from '@/features/employees/useEmployee';
export type { UseEmployeeResult } from '@/features/employees/useEmployee';

export { EmployeesFilters } from '@/features/employees/EmployeesFilters';
export { EmployeesTable } from '@/features/employees/EmployeesTable';
export { EmployeesList } from '@/features/employees/EmployeesList';
export { CreateEmployeeModal } from '@/features/employees/CreateEmployeeModal';

export {
  countEmployeesByFilter,
  filterEmployees,
  roleLabel,
  searchEmployees,
} from '@/features/employees/filters';
export type { EmployeeFilter } from '@/features/employees/filters';
export { EditEmployeeModal } from '@/features/employees/EditEmployeeModal';
import { EmployeesList } from '@/features/employees';

export default function Employees() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h2 className="font-heading text-2xl">Employees</h2>
        <p className="text-muted-gray text-sm mt-1">
          Manage accounts, roles, and departments.
        </p>
      </div>

      <EmployeesList />
    </div>
  );
}
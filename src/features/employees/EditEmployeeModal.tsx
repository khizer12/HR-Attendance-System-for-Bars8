import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { updateEmployee } from '@/features/employees/api';
import type { EmployeeRow } from '@/features/employees/api';
import { useSchedules } from '@/features/schedules';
import type { Role } from '@/types/auth';

interface EditEmployeeModalProps {
  open: boolean;
  employee: EmployeeRow | null;
  /** The signed-in super admin's id — prevents self-lockout. */
  selfId: string;
  onClose: () => void;
  onSaved: () => void;
}

const ROLES: Array<{ value: Role; label: string }> = [
  { value: 'employee', label: 'Employee' },
  { value: 'sub_admin', label: 'Sub Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function EditEmployeeModal({
  open,
  employee,
  selfId,
  onClose,
  onSaved,
}: EditEmployeeModalProps) {
  if (!employee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit employee"
      description={employee.email}
    >
      {/*
        Keyed by employee.id: when a different employee is edited, React
        remounts EditForm with fresh initial state — no sync effect needed.
      */}
      <EditForm
        key={employee.id}
        employee={employee}
        selfId={selfId}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}

interface EditFormProps {
  employee: EmployeeRow;
  selfId: string;
  onClose: () => void;
  onSaved: () => void;
}

function EditForm({ employee, selfId, onClose, onSaved }: EditFormProps) {
  const isSelf = employee.id === selfId;
  const { schedules } = useSchedules();

  const [fullName, setFullName] = useState(employee.full_name);
  const [role, setRole] = useState<Role>(employee.role);
  const [department, setDepartment] = useState(employee.department ?? '');
  const [managedDepartments, setManagedDepartments] = useState(
    employee.managed_departments.join(', '),
  );
  const [scheduleId, setScheduleId] = useState<string>(
    employee.schedule_id ?? '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Full name is required.');
      return;
    }

    const managed: string[] =
      role === 'sub_admin'
        ? managedDepartments
            .split(',')
            .map((d: string) => d.trim())
            .filter((d: string) => d.length > 0)
        : [];

    setSubmitting(true);
    try {
      await updateEmployee(employee.id, {
        full_name: fullName.trim(),
        role,
        department: department.trim() || null,
        managed_departments: managed,
        schedule_id: scheduleId || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        disabled={submitting}
        required
      />

      <div>
        <label
          htmlFor="edit-role"
          className="block text-xs font-medium text-off-white mb-1.5"
        >
          Role
        </label>
        <select
          id="edit-role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          disabled={submitting || isSelf}
          className="w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3 border border-charcoal-3 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {isSelf && (
          <p className="text-xs text-warning mt-1.5">
            You cannot change your own role — it would lock you out.
          </p>
        )}
      </div>

      <Input
        label="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        disabled={submitting}
      />

      <div>
        <label
          htmlFor="edit-schedule"
          className="block text-xs font-medium text-off-white mb-1.5"
        >
          Schedule
        </label>
        <select
          id="edit-schedule"
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
          disabled={submitting}
          className="w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3 border border-charcoal-3 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60 disabled:opacity-50"
        >
          <option value="">— No schedule —</option>
          {schedules
            .filter((s) => s.active || s.id === employee.schedule_id)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
        <p className="text-xs text-muted-gray mt-1.5">
          Controls this employee&apos;s working hours and lateness rules.
        </p>
      </div>

      {role === 'sub_admin' && (
        <Input
          label="Managed departments"
          value={managedDepartments}
          onChange={(e) => setManagedDepartments(e.target.value)}
          disabled={submitting}
          hint="Comma-separated. Example: Sales, Support"
        />
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
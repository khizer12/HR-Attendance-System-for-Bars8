import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { createEmployee } from '@/features/employees/api';
import type { Role } from '@/types/auth';

interface CreateEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ROLES: Array<{ value: Role; label: string }> = [
  { value: 'employee', label: 'Employee' },
  { value: 'sub_admin', label: 'Sub Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreateEmployeeModal({
  open,
  onClose,
  onCreated,
}: CreateEmployeeModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [department, setDepartment] = useState('');
  const [managedDepartments, setManagedDepartments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('employee');
    setDepartment('');
    setManagedDepartments('');
    setError(null);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Full name is required.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const managed =
      role === 'sub_admin' && managedDepartments.trim().length > 0
        ? managedDepartments
            .split(',')
            .map((d) => d.trim())
            .filter(Boolean)
        : [];

    setSubmitting(true);
    try {
      await createEmployee({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        role,
        department: department.trim() || null,
        managed_departments: managed,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create employee.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add employee"
      description="Creates a new account. The employee can sign in immediately."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={submitting}
          autoComplete="off"
          required
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          autoComplete="off"
          required
        />

        <Input
          label="Temporary password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          hint="Minimum 8 characters. Share it securely with the employee."
          autoComplete="off"
          required
        />

        <div>
          <label
            htmlFor="create-role"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Role
          </label>
          <select
            id="create-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={submitting}
            className="w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3 border border-charcoal-3 focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60 disabled:opacity-50"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          disabled={submitting}
          hint="Optional. Used to group employees and scope sub-admins."
        />

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
            Create employee
          </Button>
        </div>
      </form>
    </Modal>
  );
}
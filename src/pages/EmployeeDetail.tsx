import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmployeeVerificationLog } from '@/features/location';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/features/auth';
import {
  EditEmployeeModal,
  roleLabel,
  useEmployee,
} from '@/features/employees';
import type { EmployeeRow } from '@/features/employees';

function initials(name: string, email: string): string {
  const src = name.trim() || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile: callerProfile, isSuperAdmin } = useAuth();
  const { employee, loading, error, refresh } = useEmployee(id);
  const [editOpen, setEditOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl">
        <p className="text-sm text-muted-gray">Loading…</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl space-y-4">
        <Link to="/employees" className="text-xs text-muted-gray hover:text-off-white">
          ← Back to employees
        </Link>
        <Card className="p-6">
          <p className="text-sm text-danger">
            {error ?? 'Employee not found.'}
          </p>
        </Card>
      </div>
    );
  }

  const roleBadgeVariant =
    employee.role === 'super_admin'
      ? 'lime'
      : employee.role === 'sub_admin'
        ? 'info'
        : 'neutral';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/employees"
          className="text-xs text-muted-gray hover:text-off-white transition-colors"
        >
          ← Back to employees
        </Link>

        {isSuperAdmin && (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-5">
          <div className="h-14 w-14 rounded-full bg-charcoal-3 flex items-center justify-center text-lg font-medium text-off-white">
            {initials(employee.full_name, employee.email)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-xl truncate">
              {employee.full_name || 'Unnamed user'}
            </h2>
            <p className="text-sm text-muted-gray truncate">{employee.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant={roleBadgeVariant}>
                {roleLabel(employee.role)}
              </Badge>
              <Badge variant={employee.active ? 'success' : 'muted'}>
                {employee.active ? 'Active' : 'Inactive'}
              </Badge>
              {employee.department && (
                <Badge variant="neutral">{employee.department}</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Row label="Employee ID" value={employee.id} mono />
            <Row
              label="Created"
              value={new Date(employee.created_at).toLocaleDateString('en-GB')}
            />
            <Row
              label="Updated"
              value={new Date(employee.updated_at).toLocaleDateString('en-GB')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Row label="Role" value={roleLabel(employee.role)} />
            <Row
              label="Managed departments"
              value={
                employee.managed_departments.length > 0
                  ? employee.managed_departments.join(', ')
                  : '—'
              }
            />
            <Row label="Status" value={employee.active ? 'Active' : 'Inactive'} />
          </CardBody>
        </Card>
      </div>

      <EmployeeVerificationLog employeeId={employee.id} />

      {callerProfile && (
        <EditEmployeeModal
          open={editOpen}
          employee={employee as EmployeeRow}
          selfId={callerProfile.id}
          onClose={() => setEditOpen(false)}
          onSaved={() => void refresh()}
        />
      )}
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function Row({ label, value, mono }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-gray shrink-0">{label}</span>
      <span
        className={
          mono
            ? 'text-off-white font-mono text-xs truncate'
            : 'text-off-white text-right truncate'
        }
      >
        {value}
      </span>
    </div>
  );
}
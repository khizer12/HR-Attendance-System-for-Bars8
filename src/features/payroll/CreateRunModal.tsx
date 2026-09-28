import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { createPayrollRun } from '@/features/payroll/runApi';
import { useAuth } from '@/features/auth';
import { cn } from '@/utils/cn';

interface CreateRunModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (runId: string) => void;
}

function defaultMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function CreateRunModal({
  open,
  onClose,
  onCreated,
}: CreateRunModalProps) {
  const { isSuperAdmin, isSubAdmin } = useAuth();
  const [month, setMonth] = useState(defaultMonth());
  const [notes, setNotes] = useState('');
  const [absenceMode, setAbsenceMode] = useState<'' | 'flat' | 'auto'>('');
  const [lateMode, setLateMode] = useState<'' | 'flat' | 'waived'>('');
  const [absenceFlat, setAbsenceFlat] = useState('');
  const [lateFlat, setLateFlat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPickModes = isSuperAdmin;

  function reset() {
    setMonth(defaultMonth());
    setNotes('');
    setAbsenceMode('');
    setLateMode('');
    setAbsenceFlat('');
    setLateFlat('');
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

    if (!/^\d{4}-\d{2}-01$/.test(month)) {
      setError('Month must be the first day of a month.');
      return;
    }

    setSubmitting(true);
    try {
      const run = await createPayrollRun({
        month,
        notes,
        absence_mode: canPickModes && absenceMode ? absenceMode : null,
        absence_flat_amount:
          canPickModes && absenceMode === 'flat' && absenceFlat
            ? Number(absenceFlat)
            : null,
        late_mode: canPickModes && lateMode ? lateMode : null,
        late_flat_amount:
          canPickModes && lateMode === 'flat' && lateFlat
            ? Number(lateFlat)
            : null,
      });
      reset();
      onCreated(run.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New payroll run"
      description="Creates a draft run. You can edit it before submitting."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Month"
          type="date"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={submitting}
          hint="Pick the first day of the month you're paying."
          required
        />

        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
          hint="Optional."
        />

        {canPickModes && (
          <>
            <div>
              <label
                htmlFor="absence-mode"
                className="block text-xs font-medium text-off-white mb-1.5"
              >
                Absence deduction mode
              </label>
              <select
                id="absence-mode"
                value={absenceMode}
                onChange={(e) =>
                  setAbsenceMode(e.target.value as '' | 'flat' | 'auto')
                }
                disabled={submitting}
                className={cn(
                  'w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3',
                  'border border-charcoal-3',
                  'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60',
                )}
              >
                <option value="">Use settings default</option>
                <option value="flat">Flat per day</option>
                <option value="auto">Auto (1 day's salary)</option>
              </select>
            </div>

            {absenceMode === 'flat' && (
              <Input
                label="Flat absence amount per day"
                type="number"
                step="0.01"
                min="0"
                value={absenceFlat}
                onChange={(e) => setAbsenceFlat(e.target.value)}
                disabled={submitting}
                placeholder="e.g. 500"
              />
            )}

            <div>
              <label
                htmlFor="late-mode"
                className="block text-xs font-medium text-off-white mb-1.5"
              >
                Late deduction mode
              </label>
              <select
                id="late-mode"
                value={lateMode}
                onChange={(e) =>
                  setLateMode(e.target.value as '' | 'flat' | 'waived')
                }
                disabled={submitting}
                className={cn(
                  'w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3',
                  'border border-charcoal-3',
                  'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60',
                )}
              >
                <option value="">Use settings default</option>
                <option value="flat">Flat per late day</option>
                <option value="waived">Waived (no deduction)</option>
              </select>
            </div>

            {lateMode === 'flat' && (
              <Input
                label="Flat late amount per day"
                type="number"
                step="0.01"
                min="0"
                value={lateFlat}
                onChange={(e) => setLateFlat(e.target.value)}
                disabled={submitting}
                placeholder="e.g. 50"
              />
            )}
          </>
        )}

        {!canPickModes && isSubAdmin && (
          <p className="text-xs text-muted-gray">
            Sub-admins use the deduction modes configured by a super admin.
          </p>
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
            Create draft
          </Button>
        </div>
      </form>
    </Modal>
  );
}
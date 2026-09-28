import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import { updatePayrollSettings } from '@/features/payroll/api';
import { usePayrollSettings } from '@/features/payroll/usePayrollSettings';
import type { PayrollSettings } from '@/types/payroll';
import { cn } from '@/utils/cn';

const selectClass = cn(
  'w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3',
  'border border-charcoal-3',
  'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60',
  'disabled:opacity-50',
);

/**
 * Wrapper. Handles loading + permission gating, then mounts the keyed
 * form once settings are available. Keying on `updated_at` means any
 * successful save remounts the form with fresh values — no state sync
 * effect needed.
 */
export function PayrollSettingsCard() {
  const { isSuperAdmin } = useAuth();
  const { settings, loading, error, refresh } = usePayrollSettings();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll defaults</CardTitle>
        </CardHeader>
        <CardBody className="px-5 py-2">
          <SkeletonRow />
          <SkeletonRow />
        </CardBody>
      </Card>
    );
  }

  if (!isSuperAdmin) return null;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll defaults</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll defaults</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted-gray">
            Payroll settings row is missing. Contact support.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <PayrollSettingsForm
      key={settings.updated_at}
      settings={settings}
      onSaved={refresh}
    />
  );
}

interface FormProps {
  settings: PayrollSettings;
  onSaved: () => Promise<void>;
}

function PayrollSettingsForm({ settings, onSaved }: FormProps) {
  const [absenceMode, setAbsenceMode] = useState<'flat' | 'auto'>(
    settings.default_absence_mode,
  );
  const [absenceFlat, setAbsenceFlat] = useState(
    String(settings.default_absence_flat_amount),
  );
  const [lateMode, setLateMode] = useState<'flat' | 'waived'>(
    settings.default_late_mode,
  );
  const [lateFlat, setLateFlat] = useState(
    String(settings.default_late_flat_amount),
  );
  const [usdToAed, setUsdToAed] = useState(
    String(settings.usd_to_aed_rate ?? 3.6725),
  );
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setActionError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await updatePayrollSettings({
        default_absence_mode: absenceMode,
        default_absence_flat_amount: Number(absenceFlat) || 0,
        default_late_mode: lateMode,
        default_late_flat_amount: Number(lateFlat) || 0,
        usd_to_aed_rate: Number(usdToAed) || 3.6725,
      });
      setSuccess(true);
      await onSaved();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Payroll defaults</CardTitle>
          <p className="text-xs text-muted-gray mt-1">
            Applied to new runs unless a run-level override is set.
          </p>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <label
            htmlFor="ps-absence-mode"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Default absence deduction mode
          </label>
          <select
            id="ps-absence-mode"
            value={absenceMode}
            onChange={(e) => setAbsenceMode(e.target.value as 'flat' | 'auto')}
            disabled={submitting}
            className={selectClass}
          >
            <option value="auto">Auto — one day's salary per absent day</option>
            <option value="flat">Flat — fixed amount per absent day</option>
          </select>
        </div>

        {absenceMode === 'flat' && (
          <Input
            label="Flat absence amount (per day)"
            type="number"
            step="0.01"
            min="0"
            value={absenceFlat}
            onChange={(e) => setAbsenceFlat(e.target.value)}
            disabled={submitting}
          />
        )}

        <div>
          <label
            htmlFor="ps-late-mode"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Default late deduction mode
          </label>
          <select
            id="ps-late-mode"
            value={lateMode}
            onChange={(e) => setLateMode(e.target.value as 'flat' | 'waived')}
            disabled={submitting}
            className={selectClass}
          >
            <option value="waived">Waived — no deduction for late arrivals</option>
            <option value="flat">Flat — fixed amount per late day</option>
          </select>
        </div>

        {lateMode === 'flat' && (
          <Input
            label="Flat late amount (per day)"
            type="number"
            step="0.01"
            min="0"
            value={lateFlat}
            onChange={(e) => setLateFlat(e.target.value)}
            disabled={submitting}
          />
        )}

        <Input
          label="USD → AED rate"
          type="number"
          step="0.0001"
          min="0"
          value={usdToAed}
          onChange={(e) => setUsdToAed(e.target.value)}
          disabled={submitting}
          hint="Used to convert bonus amounts to AED when the employee is paid in AED."
        />

        {(actionError || success) && (
          <div
            role="alert"
            className={cn(
              'rounded-md px-3 py-2 text-xs',
              actionError
                ? 'bg-danger/10 border border-danger/30 text-danger'
                : 'bg-success/10 border border-success/30 text-success',
            )}
          >
            {actionError ?? 'Saved.'}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            loading={submitting}
          >
            Save defaults
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
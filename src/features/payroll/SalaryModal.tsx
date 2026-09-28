import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { setSalary } from '@/features/payroll/api';
import type { PayrollCurrency, SalaryStructure } from '@/types/payroll';
import { cn } from '@/utils/cn';

interface SalaryModalProps {
  open: boolean;
  employeeId: string;
  current: SalaryStructure | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SalaryModal({
  open,
  employeeId,
  current,
  onClose,
  onSaved,
}: SalaryModalProps) {
  const [currency, setCurrency] = useState<PayrollCurrency>(
    current?.currency ?? 'AED',
  );
  const [baseMonthly, setBaseMonthly] = useState<string>(
    current?.base_monthly != null ? String(current.base_monthly) : '',
  );
  const [notes, setNotes] = useState(current?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const amount = Number(baseMonthly);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Base monthly must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      await setSalary(employeeId, {
        currency,
        base_monthly: amount,
        notes,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save salary.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={current ? 'Update salary' : 'Set salary'}
      description={
        current
          ? 'The current structure will be closed and a new one starts today. History is preserved.'
          : 'Base monthly salary in the selected currency.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="salary-currency"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Currency
          </label>
          <select
            id="salary-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as PayrollCurrency)}
            disabled={submitting}
            className={cn(
              'w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3',
              'border border-charcoal-3',
              'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60',
              'disabled:opacity-50',
            )}
          >
            <option value="AED">AED — UAE Dirham</option>
            <option value="USDT">USDT — Tether</option>
          </select>
        </div>

        <Input
          label="Base monthly"
          type="number"
          step="0.01"
          min="0"
          value={baseMonthly}
          onChange={(e) => setBaseMonthly(e.target.value)}
          disabled={submitting}
          placeholder="e.g. 8000.00"
          required
        />

        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={submitting}
          hint="Optional. Visible only to admins."
        />

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
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {current ? 'Update salary' : 'Set salary'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { updatePayrollItem } from '@/features/payroll/runApi';
import type { PayrollItem } from '@/types/payroll';
import { cn } from '@/utils/cn';

interface EditItemModalProps {
  open: boolean;
  item: PayrollItem | null;
  /** When true, late_waived can be toggled. */
  canWaiveLate: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function money(v: number): string {
  return v.toFixed(2);
}

export function EditItemModal({
  open,
  item,
  canWaiveLate,
  onClose,
  onSaved,
}: EditItemModalProps) {
  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit payslip line"
      description={`${item.currency} · base ${money(item.base_monthly_snapshot)}`}
      className="max-w-2xl"
    >
      <EditItemForm
        key={item.id}
        item={item}
        canWaiveLate={canWaiveLate}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}

interface FormProps {
  item: PayrollItem;
  canWaiveLate: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function EditItemForm({
  item,
  canWaiveLate,
  onClose,
  onSaved,
}: FormProps) {
  const [bonusAmount, setBonusAmount] = useState(money(item.bonus_amount));
  const [bonusNote, setBonusNote] = useState(item.bonus_note ?? '');
  const [absenceDed, setAbsenceDed] = useState(money(item.absence_deduction));
  const [absenceNote, setAbsenceNote] = useState(item.absence_note ?? '');
  const [lateDed, setLateDed] = useState(money(item.late_deduction));
  const [lateWaived, setLateWaived] = useState(item.late_waived);
  const [lateWaiveReason, setLateWaiveReason] = useState(
    item.late_waive_reason ?? '',
  );
  const [manualAdd, setManualAdd] = useState(money(item.manual_addition));
  const [manualDed, setManualDed] = useState(money(item.manual_deduction));
  const [manualNote, setManualNote] = useState(item.manual_note ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const netPay = useMemo(() => {
    const base = item.base_earned;
    const bonus = Number(bonusAmount) || 0;
    const absDed = Number(absenceDed) || 0;
    const late = lateWaived ? 0 : Number(lateDed) || 0;
    const mAdd = Number(manualAdd) || 0;
    const mDed = Number(manualDed) || 0;
    return Math.round((base + bonus - absDed - late + mAdd - mDed) * 100) / 100;
  }, [item.base_earned, bonusAmount, absenceDed, lateDed, lateWaived, manualAdd, manualDed]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    setSubmitting(true);
    try {
      await updatePayrollItem(item.id, {
        bonus_amount: Number(bonusAmount) || 0,
        bonus_note: bonusNote.trim() || null,
        absence_deduction: Number(absenceDed) || 0,
        absence_note: absenceNote.trim() || null,
        late_deduction: Number(lateDed) || 0,
        late_waived: lateWaived,
        late_waive_reason: lateWaived ? lateWaiveReason.trim() || null : null,
        manual_addition: Number(manualAdd) || 0,
        manual_deduction: Number(manualDed) || 0,
        manual_note: manualNote.trim() || null,
        net_pay: netPay,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Read-only snapshot */}
      <div className="rounded-md bg-charcoal-2 p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-muted-gray">Present</p>
          <p className="text-off-white tabular-nums">{item.present_days}</p>
        </div>
        <div>
          <p className="text-muted-gray">Paid leave</p>
          <p className="text-off-white tabular-nums">{item.paid_leave_days}</p>
        </div>
        <div>
          <p className="text-muted-gray">Absent</p>
          <p className="text-off-white tabular-nums">{item.absent_days}</p>
        </div>
        <div>
          <p className="text-muted-gray">Late</p>
          <p className="text-off-white tabular-nums">{item.late_days}</p>
        </div>
        <div className="col-span-2 sm:col-span-4 pt-2 border-t border-charcoal-3">
          <p className="text-muted-gray">
            Base earned ({item.base_monthly_snapshot} × {item.present_days + item.paid_leave_days} / {item.working_days_snapshot})
          </p>
          <p className="text-off-white tabular-nums text-sm">
            {money(item.base_earned)} {item.currency}
          </p>
        </div>
      </div>

      {/* Editable: Bonus */}
      <div className="space-y-3">
        <h3 className="font-heading text-sm font-semibold text-off-white">
          Bonus
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Amount (${item.currency})`}
            type="number"
            step="0.01"
            min="0"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(e.target.value)}
            disabled={submitting}
          />
          <Input
            label="Note"
            value={bonusNote}
            onChange={(e) => setBonusNote(e.target.value)}
            disabled={submitting}
            placeholder="e.g. October deposits — tier 2"
          />
        </div>
      </div>

      {/* Editable: Absence deduction */}
      <div className="space-y-3">
        <h3 className="font-heading text-sm font-semibold text-off-white">
          Absence deduction
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Amount (${item.currency})`}
            type="number"
            step="0.01"
            min="0"
            value={absenceDed}
            onChange={(e) => setAbsenceDed(e.target.value)}
            disabled={submitting}
          />
          <Input
            label="Note"
            value={absenceNote}
            onChange={(e) => setAbsenceNote(e.target.value)}
            disabled={submitting}
            placeholder="e.g. 3 unpaid days"
          />
        </div>
      </div>

      {/* Editable: Late deduction */}
      <div className="space-y-3">
        <h3 className="font-heading text-sm font-semibold text-off-white">
          Late deduction
        </h3>

        {canWaiveLate && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={lateWaived}
              onChange={(e) => setLateWaived(e.target.checked)}
              disabled={submitting}
              className="mt-1 h-4 w-4 rounded border-charcoal-3 bg-charcoal-2 text-lime focus:ring-lime focus:ring-offset-charcoal"
            />
            <span>
              <span className="block text-sm text-off-white">
                Waive late deduction
              </span>
              <span className="block text-xs text-muted-gray">
                Zeroes the deduction and records who approved it.
              </span>
            </span>
          </label>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Amount (${item.currency})`}
            type="number"
            step="0.01"
            min="0"
            value={lateDed}
            onChange={(e) => setLateDed(e.target.value)}
            disabled={submitting || lateWaived}
          />
          {lateWaived && (
            <Input
              label="Waive reason"
              value={lateWaiveReason}
              onChange={(e) => setLateWaiveReason(e.target.value)}
              disabled={submitting}
              placeholder="e.g. Approved by management"
            />
          )}
        </div>
      </div>

      {/* Editable: Manual additions / deductions */}
      <div className="space-y-3">
        <h3 className="font-heading text-sm font-semibold text-off-white">
          Manual adjustments
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Addition (${item.currency})`}
            type="number"
            step="0.01"
            min="0"
            value={manualAdd}
            onChange={(e) => setManualAdd(e.target.value)}
            disabled={submitting}
          />
          <Input
            label={`Deduction (${item.currency})`}
            type="number"
            step="0.01"
            min="0"
            value={manualDed}
            onChange={(e) => setManualDed(e.target.value)}
            disabled={submitting}
          />
        </div>
        <Input
          label="Adjustment note"
          value={manualNote}
          onChange={(e) => setManualNote(e.target.value)}
          disabled={submitting}
          hint="Explain the adjustment for the audit trail."
        />
      </div>

      {/* Live net pay preview */}
      <div className="rounded-md border border-charcoal-3 bg-charcoal-2 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-gray">Net pay</span>
          <span
            className={cn(
              'font-heading text-2xl font-semibold tabular-nums',
              netPay < 0 ? 'text-danger' : 'text-off-white',
            )}
          >
            {netPay.toFixed(2)} {item.currency}
          </span>
        </div>
      </div>

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
          Save changes
        </Button>
      </div>
    </form>
  );
}
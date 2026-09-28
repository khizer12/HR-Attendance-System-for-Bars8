import { Modal } from '@/components/ui/Modal';
import type { PayslipWithRun } from '@/features/payroll/useMyPayslips';

interface PayslipDetailModalProps {
  open: boolean;
  payslip: PayslipWithRun | null;
  onClose: () => void;
}

function fmt(v: number): string {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function monthLabel(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function PayslipDetailModal({
  open,
  payslip,
  onClose,
}: PayslipDetailModalProps) {
  if (!payslip) return null;

  const gross = payslip.base_earned + payslip.bonus_amount + payslip.manual_addition;
  const lateDeduction = payslip.late_waived ? 0 : payslip.late_deduction;
  const totalDeductions =
    payslip.absence_deduction + lateDeduction + payslip.manual_deduction;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payslip · ${monthLabel(payslip.run_month)}`}
      description={`${payslip.currency}`}
    >
      <div className="space-y-4">
        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-gray mb-2">
            Attendance
          </h3>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-gray">Working days</dt>
            <dd className="text-off-white text-right tabular-nums">
              {payslip.working_days_snapshot}
            </dd>

            <dt className="text-muted-gray">Present</dt>
            <dd className="text-off-white text-right tabular-nums">
              {payslip.present_days}
            </dd>

            <dt className="text-muted-gray">Paid leave</dt>
            <dd className="text-off-white text-right tabular-nums">
              {payslip.paid_leave_days}
            </dd>

            <dt className="text-muted-gray">Unpaid leave</dt>
            <dd className="text-off-white text-right tabular-nums">
              {payslip.unpaid_leave_days}
            </dd>

            <dt className="text-muted-gray">Absent</dt>
            <dd className="text-off-white text-right tabular-nums">
              {payslip.absent_days}
            </dd>

            <dt className="text-muted-gray">Late days</dt>
            <dd className="text-off-white text-right tabular-nums">
              {payslip.late_days}
            </dd>
          </dl>
        </section>

        <section className="border-t border-charcoal-3 pt-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-gray mb-2">
            Earnings
          </h3>
          <dl className="space-y-2 text-sm">
            <Line label="Base earned" value={payslip.base_earned} currency={payslip.currency} />
            {payslip.bonus_amount > 0 && (
              <Line
                label="Bonus"
                value={payslip.bonus_amount}
                currency={payslip.currency}
                note={payslip.bonus_note ?? undefined}
              />
            )}
            {payslip.manual_addition > 0 && (
              <Line
                label="Manual addition"
                value={payslip.manual_addition}
                currency={payslip.currency}
                note={payslip.manual_note ?? undefined}
              />
            )}
          </dl>
        </section>

        <section className="border-t border-charcoal-3 pt-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-gray mb-2">
            Deductions
          </h3>
          <dl className="space-y-2 text-sm">
            {payslip.absence_deduction > 0 && (
              <Line
                label="Absence"
                value={payslip.absence_deduction}
                currency={payslip.currency}
                note={payslip.absence_note ?? undefined}
                tone="danger"
              />
            )}
            {lateDeduction > 0 && (
              <Line
                label="Late arrivals"
                value={lateDeduction}
                currency={payslip.currency}
                tone="danger"
              />
            )}
            {payslip.late_waived && (
              <div className="text-xs text-success">
                Late deduction waived
                {payslip.late_waive_reason ? ` — ${payslip.late_waive_reason}` : ''}
              </div>
            )}
            {payslip.manual_deduction > 0 && (
              <Line
                label="Manual deduction"
                value={payslip.manual_deduction}
                currency={payslip.currency}
                note={payslip.manual_note ?? undefined}
                tone="danger"
              />
            )}
            {totalDeductions === 0 && (
              <p className="text-xs text-muted-gray">No deductions.</p>
            )}
          </dl>
        </section>

        <section className="border-t border-charcoal-3 pt-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-gray">
                Net pay
              </p>
              <p className="text-[10px] text-muted-gray mt-0.5">
                Gross {fmt(gross)} − Deductions {fmt(totalDeductions)}
              </p>
            </div>
            <p className="font-heading text-2xl text-off-white tabular-nums">
              {fmt(payslip.net_pay)} {payslip.currency}
            </p>
          </div>
        </section>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-gray hover:text-off-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface LineProps {
  label: string;
  value: number;
  currency: string;
  note?: string;
  tone?: 'default' | 'danger';
}

function Line({ label, value, currency, note, tone = 'default' }: LineProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <dt className="text-muted-gray">{label}</dt>
        {note && (
          <p className="text-[10px] text-muted-gray truncate">{note}</p>
        )}
      </div>
      <dd
        className={
          tone === 'danger'
            ? 'text-danger tabular-nums shrink-0'
            : 'text-off-white tabular-nums shrink-0'
        }
      >
        {fmt(value)} {currency}
      </dd>
    </div>
  );
}
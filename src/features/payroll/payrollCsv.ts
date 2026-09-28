import type { PayrollItem, PayrollRun } from '@/types/payroll';

const HEADER = [
  'Month',
  'Employee ID',
  'Currency',
  'Base Monthly',
  'Working Days',
  'Present',
  'Paid Leave',
  'Unpaid Leave',
  'Absent',
  'Late Days',
  'Base Earned',
  'Bonus',
  'Bonus Note',
  'Absence Deduction',
  'Absence Note',
  'Late Deduction',
  'Late Waived',
  'Late Waive Reason',
  'Manual Addition',
  'Manual Deduction',
  'Manual Note',
  'Net Pay',
];

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fmtMoney(n: number): string {
  return n.toFixed(2);
}

export function payrollItemsToCsv(
  run: PayrollRun,
  items: PayrollItem[],
): string {
  const lines: string[] = [];
  lines.push(HEADER.join(','));

  const monthLabel = new Date(run.month + 'T00:00:00Z').toLocaleDateString(
    'en-GB',
    { month: 'long', year: 'numeric', timeZone: 'UTC' },
  );

  for (const it of items) {
    const cells = [
      monthLabel,
      it.employee_id,
      it.currency,
      fmtMoney(it.base_monthly_snapshot),
      String(it.working_days_snapshot),
      String(it.present_days),
      String(it.paid_leave_days),
      String(it.unpaid_leave_days),
      String(it.absent_days),
      String(it.late_days),
      fmtMoney(it.base_earned),
      fmtMoney(it.bonus_amount),
      it.bonus_note ?? '',
      fmtMoney(it.absence_deduction),
      it.absence_note ?? '',
      fmtMoney(it.late_deduction),
      it.late_waived ? 'Yes' : 'No',
      it.late_waive_reason ?? '',
      fmtMoney(it.manual_addition),
      fmtMoney(it.manual_deduction),
      it.manual_note ?? '',
      fmtMoney(it.net_pay),
    ];
    lines.push(cells.map(escapeCell).join(','));
  }

  const currencies = new Set(items.map((i) => i.currency));
  if (currencies.size === 1 && items.length > 0) {
    const sum = (pick: (i: PayrollItem) => number) =>
      items.reduce((a, i) => a + pick(i), 0);
    lines.push(
      [
        'TOTAL',
        '',
        [...currencies][0],
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        fmtMoney(sum((i) => i.base_earned)),
        fmtMoney(sum((i) => i.bonus_amount)),
        '',
        fmtMoney(sum((i) => i.absence_deduction)),
        '',
        fmtMoney(sum((i) => (i.late_waived ? 0 : i.late_deduction))),
        '',
        '',
        fmtMoney(sum((i) => i.manual_addition)),
        fmtMoney(sum((i) => i.manual_deduction)),
        '',
        fmtMoney(sum((i) => i.net_pay)),
      ]
        .map(escapeCell)
        .join(','),
    );
  }

  return lines.join('\r\n');
}

export function payrollFilename(run: PayrollRun): string {
  const m = run.month.slice(0, 7);
  const date = new Date().toISOString().slice(0, 10);
  return `payroll-${m}-${date}.csv`;
}

export { downloadCsv } from '@/features/reports/csv';
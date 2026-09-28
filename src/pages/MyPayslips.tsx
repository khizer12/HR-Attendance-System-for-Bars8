import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import {
  PayslipDetailModal,
  useMyPayslips,
  type PayslipWithRun,
} from '@/features/payroll';

function monthLabel(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function fmt(v: number): string {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MyPayslips() {
  const { rows, loading, error } = useMyPayslips();
  const [open, setOpen] = useState<PayslipWithRun | null>(null);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h2 className="font-heading text-2xl">My payslips</h2>
        <p className="text-muted-gray text-sm mt-1">
          Payslips are published after each payroll run.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
          <p className="text-xs text-muted-gray mt-1">
            {rows.length} {rows.length === 1 ? 'payslip' : 'payslips'}
          </p>
        </CardHeader>
        <CardBody className="p-0">
          {loading && rows.length === 0 ? (
            <div className="px-5 py-2">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center px-5">
              <p className="text-sm text-muted-gray">
                No published payslips yet.
              </p>
              <p className="text-xs text-muted-gray mt-1">
                You'll see them here once payroll is published.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-charcoal-3">
              {rows.map((p) => (
                <li
                  key={p.id}
                  className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-charcoal-2/40 cursor-pointer transition-colors"
                  onClick={() => setOpen(p)}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-off-white">
                      {monthLabel(p.run_month)}
                    </p>
                    <p className="text-xs text-muted-gray mt-1">
                      {p.present_days}p · {p.paid_leave_days}l ·{' '}
                      {p.absent_days}a · {p.late_days}late
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="success">Published</Badge>
                    <span className="font-heading text-sm text-off-white tabular-nums">
                      {fmt(p.net_pay)} {p.currency}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <PayslipDetailModal
        open={open !== null}
        payslip={open}
        onClose={() => setOpen(null)}
      />
    </div>
  );
}
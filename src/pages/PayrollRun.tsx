import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import {
  BonusUploadModal,
  EditItemModal,
  calculateRun,
  downloadCsv,
  payrollFilename,
  payrollItemsToCsv,
  updateRunStatus,
  useRunItems,
} from '@/features/payroll';
import type { PayrollItem, PayrollRunStatus } from '@/types/payroll';
import { formatDateShort } from '@/lib/time';

const STATUS_VARIANT: Record<
  PayrollRunStatus,
  'neutral' | 'warning' | 'info' | 'success' | 'muted' | 'danger'
> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  published: 'success',
  cancelled: 'muted',
};

const STATUS_LABEL: Record<PayrollRunStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  approved: 'Approved',
  published: 'Published',
  cancelled: 'Cancelled',
};

function formatMonth(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function money(v: number): string {
  return v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PayrollRun() {
  const { id } = useParams<{ id: string }>();
  const { isSuperAdmin } = useAuth();
  const { run, items, loading, error, refresh } = useRunItems(id);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PayrollItem | null>(null);
  const [bonusOpen, setBonusOpen] = useState(false);

  const editable =
    run?.status === 'draft' || run?.status === 'pending_approval';

  async function runAction(fn: () => Promise<void>) {
    setActionError(null);
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl space-y-4">
        <Link
          to="/payroll"
          className="text-xs text-muted-gray hover:text-off-white transition-colors"
        >
          ← Back to payroll
        </Link>
        <Card className="p-6">
          <p className="text-sm text-danger">{error ?? 'Run not found.'}</p>
        </Card>
      </div>
    );
  }

  const totals = items.reduce(
    (acc, i) => {
      acc.net += i.net_pay;
      return acc;
    },
    { net: 0 },
  );

  function handleExportCsv() {
    if (!run || items.length === 0) return;
    const csv = payrollItemsToCsv(run, items);
    downloadCsv(payrollFilename(run), csv);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <Link
          to="/payroll"
          className="text-xs text-muted-gray hover:text-off-white transition-colors"
        >
          ← Back to payroll
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl">
            Payroll · {formatMonth(run.month)}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={STATUS_VARIANT[run.status]}>
              {STATUS_LABEL[run.status]}
            </Badge>
            <span className="text-xs text-muted-gray">
              Created {formatDateShort(run.created_at)}
            </span>
          </div>
          {run.notes && (
            <p className="text-xs text-off-white mt-2 italic">{run.notes}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            disabled={items.length === 0}
          >
            Export CSV
          </Button>

          {editable && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBonusOpen(true)}
            >
              Upload bonuses
            </Button>
          )}

          {editable && (
            <Button
              variant="secondary"
              size="sm"
              loading={busy}
              onClick={() =>
                void runAction(async () => {
                  const count = await calculateRun(run.id);
                  window.alert(`Calculated ${count} payslip(s).`);
                })
              }
            >
              Recalculate
            </Button>
          )}

          {run.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              loading={busy}
              onClick={() =>
                void runAction(() =>
                  updateRunStatus(run.id, 'pending_approval'),
                )
              }
            >
              Submit for approval
            </Button>
          )}

          {run.status === 'pending_approval' && isSuperAdmin && (
            <Button
              variant="primary"
              size="sm"
              loading={busy}
              onClick={() =>
                void runAction(() => updateRunStatus(run.id, 'approved'))
              }
            >
              Approve
            </Button>
          )}

          {run.status === 'approved' && isSuperAdmin && (
            <Button
              variant="primary"
              size="sm"
              loading={busy}
              onClick={() =>
                void runAction(() => updateRunStatus(run.id, 'published'))
              }
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {actionError}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Payslips</CardTitle>
            <p className="text-xs text-muted-gray mt-1">
              {items.length} {items.length === 1 ? 'payslip' : 'payslips'} ·
              Total net {money(totals.net)}
            </p>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-gray">
                No payslips yet. Click <strong>Recalculate</strong> to generate
                them.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-gray border-b border-charcoal-3">
                    <th className="font-medium py-2.5 px-5">Employee</th>
                    <th className="font-medium py-2.5 pr-3 tabular-nums">
                      Days
                    </th>
                    <th className="font-medium py-2.5 pr-3 tabular-nums">
                      Base
                    </th>
                    <th className="font-medium py-2.5 pr-3 tabular-nums">
                      Bonus
                    </th>
                    <th className="font-medium py-2.5 pr-3 tabular-nums">
                      Deductions
                    </th>
                    <th className="font-medium py-2.5 pr-5 tabular-nums text-right">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      className="border-b border-charcoal-3/60 last:border-0 hover:bg-charcoal-2/40 transition-colors cursor-pointer"
                      onClick={() => editable && setEditing(it)}
                    >
                      <td className="py-3 px-5 text-off-white">
                        {it.employee_id.slice(0, 8)}…
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-muted-gray text-xs">
                        {it.present_days}p · {it.paid_leave_days}l ·{' '}
                        {it.absent_days}a · {it.late_days}late
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-off-white">
                        {money(it.base_earned)}
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-off-white">
                        {money(it.bonus_amount)}
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-off-white">
                        {money(
                          it.absence_deduction +
                            (it.late_waived ? 0 : it.late_deduction) +
                            it.manual_deduction,
                        )}
                      </td>
                      <td className="py-3 pr-5 tabular-nums text-right text-off-white font-medium">
                        {money(it.net_pay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <EditItemModal
        open={editing !== null}
        item={editing}
        canWaiveLate={isSuperAdmin}
        onClose={() => setEditing(null)}
        onSaved={() => void refresh()}
      />

      <BonusUploadModal
        open={bonusOpen}
        runId={run.id}
        onClose={() => setBonusOpen(false)}
        onApplied={() => void refresh()}
      />
    </div>
  );
}
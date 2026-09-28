import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import {
  CreateRunModal,
  calculateRun,
  updateRunStatus,
  usePayrollRuns,
} from '@/features/payroll';
import type { PayrollRun, PayrollRunStatus } from '@/types/payroll';
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

export default function Payroll() {
  const { isSuperAdmin } = useAuth();
  const { runs, loading, error, refresh } = usePayrollRuns();
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function runAction(id: string, fn: () => Promise<void>) {
    setActionError(null);
    setBusyId(id);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCalculate(run: PayrollRun) {
    await runAction(run.id, async () => {
            const count = await calculateRun(run.id);
      window.alert(`Calculated ${count} payslip(s).`);
    });
  }

  async function handleSubmit(run: PayrollRun) {
    await runAction(run.id, () => updateRunStatus(run.id, 'pending_approval'));
  }

  async function handleApprove(run: PayrollRun) {
    await runAction(run.id, () => updateRunStatus(run.id, 'approved'));
  }

  async function handlePublish(run: PayrollRun) {
    await runAction(run.id, () => updateRunStatus(run.id, 'published'));
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl">Payroll</h2>
          <p className="text-muted-gray text-sm mt-1">
            Create monthly runs, review, approve, publish.
          </p>
        </div>
        {isSuperAdmin && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            New run
          </Button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {actionError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payroll runs</CardTitle>
          <p className="text-xs text-muted-gray mt-1">
            {runs.length} {runs.length === 1 ? 'run' : 'runs'}
          </p>
        </CardHeader>
        <CardBody className="p-0">
          {loading && runs.length === 0 ? (
            <div className="px-5 py-2">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : runs.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-gray">No payroll runs yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-charcoal-3">
              {runs.map((r) => {
                const busy = busyId === r.id;
                return (
                  <li
                    key={r.id}
                    className="px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-off-white">
                          {formatMonth(r.month)}
                        </span>
                        <Badge variant={STATUS_VARIANT[r.status]}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-gray mt-1">
                        Created {formatDateShort(r.created_at)}
                        {r.notes ? ` · ${r.notes}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {r.status === 'draft' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={busy}
                            onClick={() => void handleCalculate(r)}
                          >
                            Recalculate
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            loading={busy}
                            onClick={() => void handleSubmit(r)}
                          >
                            Submit for approval
                          </Button>
                        </>
                      )}
                      {r.status === 'pending_approval' && isSuperAdmin && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={busy}
                          onClick={() => void handleApprove(r)}
                        >
                          Approve
                        </Button>
                      )}
                      {r.status === 'approved' && isSuperAdmin && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={busy}
                          onClick={() => void handlePublish(r)}
                        >
                          Publish
                        </Button>
                      )}
                      <Link to={`/payroll/${r.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <CreateRunModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          void refresh().then(() => {
            window.location.href = `/payroll/${id}`;
          });
        }}
      />
    </div>
  );
}
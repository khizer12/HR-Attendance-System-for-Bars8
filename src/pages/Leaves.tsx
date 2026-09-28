import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import {
  LeaveBalanceCard,
  LeaveRequestList,
  LeaveRequestModal,
  cancelLeaveRequest,
  useLeaveData,
} from '@/features/leaves';
import type { LeaveRequestWithMeta } from '@/types/leave';

export default function Leaves() {
  const { isSuperAdmin, isSubAdmin } = useAuth();
  const { types, requests, balances, loading, error, refresh } = useLeaveData();
  const [composerOpen, setComposerOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = isSuperAdmin || isSubAdmin;

  async function handleCancel(row: LeaveRequestWithMeta) {
    if (!window.confirm(`Cancel this ${row.leave_type_name} request?`)) return;
    setActionError(null);
    setBusyId(row.id);
    try {
      await cancelLeaveRequest(row.id);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl">Leaves</h2>
          <p className="text-muted-gray text-sm mt-1">
            {isAdmin
              ? 'Request leave, and approve requests from your team.'
              : 'Request leave and track your balance.'}
          </p>
        </div>
        <Button variant="primary" onClick={() => setComposerOpen(true)}>
          Request leave
        </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My requests</CardTitle>
              <p className="text-xs text-muted-gray mt-1">
                {requests.length}{' '}
                {requests.length === 1 ? 'request' : 'requests'}
              </p>
            </CardHeader>
            <CardBody className="p-0">
              {loading && requests.length === 0 ? (
                <div className="px-5 py-2">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : (
                <LeaveRequestList
                  rows={requests}
                  actions={(r) =>
                    r.status === 'pending' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busyId === r.id}
                        onClick={() => void handleCancel(r)}
                        className="text-danger"
                      >
                        Cancel
                      </Button>
                    ) : null
                  }
                />
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <LeaveBalanceCard balances={balances} />
        </div>
      </div>

      <LeaveRequestModal
        open={composerOpen}
        leaveTypes={types}
        onClose={() => setComposerOpen(false)}
        onCreated={() => void refresh()}
      />
    </div>
  );
}
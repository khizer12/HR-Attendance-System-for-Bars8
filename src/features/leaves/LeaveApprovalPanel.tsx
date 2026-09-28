import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import {
  decideLeaveRequest,
  useAdminLeaveRequests,
} from '@/features/leaves';
import { LeaveRequestList } from '@/features/leaves/LeaveRequestList';
import type { LeaveRequestWithMeta } from '@/types/leave';

type Tab = 'pending' | 'approved' | 'rejected' | 'cancelled';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function LeaveApprovalPanel() {
  const [tab, setTab] = useState<Tab>('pending');
  const { rows, loading, error, refresh } = useAdminLeaveRequests(tab);
  const [decision, setDecision] = useState<{
    row: LeaveRequestWithMeta;
    kind: 'approved' | 'rejected';
  } | null>(null);

  async function handleDecide(
    row: LeaveRequestWithMeta,
    kind: 'approved' | 'rejected',
    note: string | null,
  ) {
    await decideLeaveRequest({ id: row.id, decision: kind, note });
    await refresh();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Team requests</CardTitle>
            <p className="text-xs text-muted-gray mt-1">
              Approve or reject leave requests from your team.
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Filter by status"
            className="flex flex-wrap gap-2"
          >
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(t.id)}
                  className={
                    'inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ' +
                    (isActive
                      ? 'bg-lime text-near-black'
                      : 'bg-charcoal-2 text-muted-gray hover:text-off-white hover:bg-charcoal-3')
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {error && (
            <div
              role="alert"
              className="mx-5 mt-4 rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
            >
              {error}
            </div>
          )}

          {loading && rows.length === 0 ? (
            <div className="px-5 py-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : (
            <LeaveRequestList
              rows={rows}
              showEmployee
              emptyMessage={
                tab === 'pending'
                  ? 'No pending requests. Team is up to date.'
                  : `No ${tab} requests.`
              }
              actions={(r) =>
                tab === 'pending' ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setDecision({ row: r, kind: 'approved' })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDecision({ row: r, kind: 'rejected' })}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null
              }
            />
          )}
        </CardBody>
      </Card>

      {decision && (
        <DecideLeaveModal
          row={decision.row}
          kind={decision.kind}
          onClose={() => setDecision(null)}
          onConfirmed={(note) => {
            void handleDecide(decision.row, decision.kind, note);
            setDecision(null);
          }}
        />
      )}
    </>
  );
}

interface DecideLeaveModalProps {
  row: LeaveRequestWithMeta;
  kind: 'approved' | 'rejected';
  onClose: () => void;
  onConfirmed: (note: string | null) => void;
}

function DecideLeaveModal({
  row,
  kind,
  onClose,
  onConfirmed,
}: DecideLeaveModalProps) {
  const [note, setNote] = useState('');
  const isApprove = kind === 'approved';

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isApprove ? 'Approve leave request' : 'Reject leave request'}
      description={`${row.employee_full_name} · ${row.leave_type_name}`}
    >
      <div className="space-y-4">
        <div className="rounded-md bg-charcoal-2 p-4 text-sm space-y-2">
          <p className="text-xs text-muted-gray tabular-nums">
            {row.start_date} → {row.end_date}
          </p>
          <p className="text-off-white whitespace-pre-wrap">{row.reason}</p>
        </div>

        <Input
          label={isApprove ? 'Optional note' : 'Reason for rejection'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isApprove
              ? 'e.g. Approved. Enjoy!'
              : 'e.g. Too many people already on leave that week.'
          }
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'primary' : 'danger'}
            onClick={() => onConfirmed(note.trim() || null)}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
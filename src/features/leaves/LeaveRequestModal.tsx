import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { createLeaveRequest } from '@/features/leaves/api';
import type { LeaveType } from '@/types/leave';
import { cn } from '@/utils/cn';

interface LeaveRequestModalProps {
  open: boolean;
  leaveTypes: LeaveType[];
  onClose: () => void;
  onCreated: () => void;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function LeaveRequestModal({
  open,
  leaveTypes,
  onClose,
  onCreated,
}: LeaveRequestModalProps) {
  const [leaveTypeId, setLeaveTypeId] = useState<string>(leaveTypes[0]?.id ?? '');
  const [startDate, setStartDate] = useState<string>(todayIso());
  const [endDate, setEndDate] = useState<string>(todayIso());
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setLeaveTypeId(leaveTypes[0]?.id ?? '');
    setStartDate(todayIso());
    setEndDate(todayIso());
    setReason('');
    setError(null);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!leaveTypeId) {
      setError('Pick a leave type.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }
    if (reason.trim().length < 3) {
      setError('Please describe your reason (at least 3 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await createLeaveRequest({
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Request leave"
      description="Your request will go to an admin for approval."
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="leave-type"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Leave type
          </label>
          <select
            id="leave-type"
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            disabled={submitting}
            className={cn(
              'w-full h-10 rounded-md bg-charcoal-2 text-off-white text-sm px-3',
              'border border-charcoal-3',
              'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60',
              'disabled:opacity-50',
            )}
          >
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {!t.is_paid ? ' (unpaid)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value > endDate) setEndDate(e.target.value);
            }}
            disabled={submitting}
            required
          />
          <Input
            label="End date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div>
          <label
            htmlFor="leave-reason"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Reason
          </label>
          <textarea
            id="leave-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
            rows={4}
            maxLength={1000}
            className={cn(
              'w-full rounded-md bg-charcoal-2 text-off-white text-sm px-3 py-2',
              'border border-charcoal-3',
              'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60',
              'disabled:opacity-50 resize-y',
            )}
            required
          />
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
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Submit request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
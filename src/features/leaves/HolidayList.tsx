import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import { deleteHoliday } from '@/features/leaves/holidayApi';
import { HolidayModal } from '@/features/leaves/HolidayModal';
import { useHolidays } from '@/features/leaves/useHolidays';
import type { Holiday } from '@/types/leave';

function formatHolidayDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function HolidayList() {
  const { isSuperAdmin } = useAuth();
  const { holidays, loading, error, refresh } = useHolidays();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(h: Holiday) {
    setEditing(h);
    setModalOpen(true);
  }

  async function handleDelete(h: Holiday) {
    if (!window.confirm(`Remove "${h.name}" from the holiday calendar?`)) return;
    setActionError(null);
    setBusyId(h.id);
    try {
      await deleteHoliday(h.id);
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Holidays</CardTitle>
            <p className="text-xs text-muted-gray mt-1">
              Company-wide non-working days. Excluded from absence detection.
            </p>
          </div>
          {isSuperAdmin && (
            <Button variant="primary" size="sm" onClick={openCreate}>
              Add holiday
            </Button>
          )}
        </CardHeader>
        <CardBody className="p-0">
          {(error || actionError) && (
            <div
              role="alert"
              className="mx-5 mt-4 rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
            >
              {error ?? actionError}
            </div>
          )}

          {loading && holidays.length === 0 ? (
            <div className="px-5 py-2">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : holidays.length === 0 ? (
            <div className="py-10 text-center px-5">
              <p className="text-sm text-muted-gray">No holidays configured.</p>
            </div>
          ) : (
            <ul className="divide-y divide-charcoal-3">
              {holidays.map((h) => (
                <li
                  key={h.id}
                  className="px-5 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-off-white">{h.name}</p>
                    <p className="text-xs text-muted-gray">
                      {formatHolidayDate(h.date)}
                      {h.description ? ` · ${h.description}` : ''}
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === h.id}
                        onClick={() => openEdit(h)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busyId === h.id}
                        onClick={() => void handleDelete(h)}
                        className="text-danger"
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <HolidayModal
        open={modalOpen}
        holiday={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void refresh()}
      />
    </>
  );
}
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth';
import {
  ScheduleModal,
  formatTimeOfDay,
  formatWorkingDays,
  useSchedules,
  type Schedule,
} from '@/features/schedules';

export function SchedulesList() {
  const { isSuperAdmin } = useAuth();
  const { schedules, loading, error, refresh } = useSchedules();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter((s) => s.name.toLowerCase().includes(q));
  }, [schedules, query]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(s: Schedule) {
    setEditing(s);
    setModalOpen(true);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Search schedules"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search schedules"
            />
          </div>
          {isSuperAdmin && (
            <Button
              variant="primary"
              onClick={openCreate}
              className="ml-auto"
            >
              Add schedule
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

        <Card>
          <CardHeader>
            <CardTitle>Schedules</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {loading && schedules.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-gray">
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-gray">
                {query ? 'No schedules match your search.' : 'No schedules yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto px-5 pb-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-gray border-b border-charcoal-3">
                      <th scope="col" className="font-medium py-2.5 pr-3">
                        Name
                      </th>
                      <th scope="col" className="font-medium py-2.5 pr-3">
                        Hours
                      </th>
                      <th
                        scope="col"
                        className="font-medium py-2.5 pr-3 hidden md:table-cell"
                      >
                        Days
                      </th>
                      <th scope="col" className="font-medium py-2.5 pr-3">
                        Grace
                      </th>
                      <th scope="col" className="font-medium py-2.5 pr-3">
                        Status
                      </th>
                      <th
                        scope="col"
                        className="font-medium py-2.5 text-right"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-charcoal-3/60 last:border-0 hover:bg-charcoal-2/40 transition-colors"
                      >
                        <td className="py-3 pr-3 text-off-white">
                          {s.name}
                        </td>
                        <td className="py-3 pr-3 text-off-white tabular-nums">
                          {formatTimeOfDay(s.start_time)} –{' '}
                          {formatTimeOfDay(s.end_time)}
                        </td>
                        <td className="py-3 pr-3 text-muted-gray text-xs hidden md:table-cell">
                          {formatWorkingDays(s.working_days)}
                        </td>
                        <td className="py-3 pr-3 text-off-white tabular-nums">
                          {s.grace_period_minutes}m
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant={s.active ? 'success' : 'muted'}>
                            {s.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(s)}
                            >
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <ScheduleModal
        open={modalOpen}
        schedule={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void refresh()}
      />
    </>
  );
}
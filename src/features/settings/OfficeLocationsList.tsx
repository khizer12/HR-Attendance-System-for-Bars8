import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/features/auth';
import {
  activateOfficeLocation,
  deactivateOfficeLocation,
  deleteOfficeLocation,
} from '@/features/settings/api';
import { OfficeLocationModal } from '@/features/settings/OfficeLocationModal';
import { useOfficeLocations } from '@/features/settings/useOfficeLocations';
import type { OfficeLocation } from '@/types/location';

export function OfficeLocationsList() {
  const { isSuperAdmin } = useAuth();
  const { offices, loading, error, refresh } = useOfficeLocations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OfficeLocation | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(o: OfficeLocation) {
    setEditing(o);
    setModalOpen(true);
  }

  async function run(id: string, fn: () => Promise<void>) {
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

  function handleDelete(o: OfficeLocation) {
    const confirmed = window.confirm(
      `Delete "${o.name}"?\n\n` +
        'Historical verification records are not affected. If a schedule ' +
        'requires location and no active office remains, clock-in will ' +
        'fail until a new one is activated.',
    );
    if (!confirmed) return;
    void run(o.id, () => deleteOfficeLocation(o.id));
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Office locations</CardTitle>
            <p className="text-xs text-muted-gray mt-1">
              Only one can be active. Geofenced clock-in uses the active one.
            </p>
          </div>
          {isSuperAdmin && (
            <Button variant="primary" size="sm" onClick={openCreate}>
              Add office
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

          {loading && offices.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-gray">
              Loading…
            </div>
          ) : offices.length === 0 ? (
            <div className="py-10 text-center px-5">
              <p className="text-sm text-muted-gray">
                No office locations configured.
              </p>
              <p className="text-xs text-muted-gray mt-1">
                Employees on geofenced schedules cannot clock in until one is
                active.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto px-5 pb-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-gray border-b border-charcoal-3">
                    <th scope="col" className="font-medium py-2.5 pr-3">
                      Name
                    </th>
                    <th scope="col" className="font-medium py-2.5 pr-3 tabular-nums">
                      Coordinates
                    </th>
                    <th
                      scope="col"
                      className="font-medium py-2.5 pr-3 tabular-nums hidden md:table-cell"
                    >
                      Radius
                    </th>
                    <th scope="col" className="font-medium py-2.5 pr-3">
                      Status
                    </th>
                    <th scope="col" className="font-medium py-2.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offices.map((o) => {
                    const isBusy = busyId === o.id;
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-charcoal-3/60 last:border-0 hover:bg-charcoal-2/40 transition-colors"
                      >
                        <td className="py-3 pr-3 text-off-white">{o.name}</td>
                        <td className="py-3 pr-3 text-muted-gray text-xs tabular-nums">
                          {o.latitude.toFixed(5)}, {o.longitude.toFixed(5)}
                        </td>
                        <td className="py-3 pr-3 text-off-white tabular-nums hidden md:table-cell">
                          {o.radius_meters} m
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant={o.is_active ? 'success' : 'muted'}>
                            {o.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {isSuperAdmin && (
                            <div className="flex justify-end gap-1.5">
                              {o.is_active ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  loading={isBusy}
                                  onClick={() =>
                                    void run(o.id, () =>
                                      deactivateOfficeLocation(o.id),
                                    )
                                  }
                                >
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  loading={isBusy}
                                  onClick={() =>
                                    void run(o.id, () =>
                                      activateOfficeLocation(o.id),
                                    )
                                  }
                                >
                                  Activate
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => openEdit(o)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => handleDelete(o)}
                                className="text-danger"
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <OfficeLocationModal
        open={modalOpen}
        office={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void refresh()}
      />
    </>
  );
}
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import { useEmployeeSalary } from '@/features/payroll/useEmployeeSalary';
import { SalaryModal } from '@/features/payroll/SalaryModal';
import { formatDateShort } from '@/lib/time';

interface SalaryCardProps {
  employeeId: string;
}

function formatMoney(amount: number, currency: 'AED' | 'USDT'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currency}`;
}

export function SalaryCard({ employeeId }: SalaryCardProps) {
  const { isSuperAdmin } = useAuth();
  const { active, history, loading, error, refresh } = useEmployeeSalary(employeeId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Salary</CardTitle>
            <p className="text-xs text-muted-gray mt-1">
              Monthly base salary. History is preserved when updated.
            </p>
          </div>
          {isSuperAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalOpen(true)}
            >
              {active ? 'Update salary' : 'Set salary'}
            </Button>
          )}
        </CardHeader>
        <CardBody className="p-0">
          {error && (
            <div className="px-5 py-4">
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="px-5 py-2">
              <SkeletonRow />
            </div>
          ) : !active ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-muted-gray">
                No salary configured.
              </p>
              {isSuperAdmin && (
                <p className="text-xs text-muted-gray mt-1">
                  Use the button above to set it.
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-charcoal-3">
              <li className="px-5 py-4">
                <p className="text-xs text-muted-gray mb-1">Current</p>
                <p className="font-heading text-xl text-off-white tabular-nums">
                  {formatMoney(active.base_monthly, active.currency)}
                </p>
                <p className="text-xs text-muted-gray mt-1">
                  Effective from {formatDateShort(active.effective_from)}
                </p>
                {active.notes && (
                  <p className="text-xs text-off-white mt-2 italic">
                    {active.notes}
                  </p>
                )}
              </li>

              {history.length > 1 && (
                <li className="px-5 py-4">
                  <p className="text-xs text-muted-gray mb-2 uppercase tracking-wider">
                    History
                  </p>
                  <ul className="space-y-2">
                    {history.slice(1).map((h) => (
                      <li
                        key={h.id}
                        className="flex items-baseline justify-between text-xs"
                      >
                        <span className="text-muted-gray tabular-nums">
                          {formatDateShort(h.effective_from)}
                          {h.effective_to
                            ? ` → ${formatDateShort(h.effective_to)}`
                            : ''}
                        </span>
                        <span className="text-off-white tabular-nums">
                          {formatMoney(h.base_monthly, h.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          )}
        </CardBody>
      </Card>

      <SalaryModal
        open={modalOpen}
        employeeId={employeeId}
        current={active}
        onClose={() => setModalOpen(false)}
        onSaved={() => void refresh()}
      />
    </>
  );
}
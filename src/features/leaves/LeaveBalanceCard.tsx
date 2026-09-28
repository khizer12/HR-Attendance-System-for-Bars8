import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import type { LeaveBalance } from '@/types/leave';

interface LeaveBalanceCardProps {
  balances: LeaveBalance[];
}

export function LeaveBalanceCard({ balances }: LeaveBalanceCardProps) {
  if (balances.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave balance</CardTitle>
        <p className="text-xs text-muted-gray mt-1">
          Used this calendar year
        </p>
      </CardHeader>
      <CardBody className="space-y-3">
        {balances.map((b) => {
          const pct =
            b.max_days_per_year === null || b.max_days_per_year === 0
              ? null
              : Math.min(100, Math.round((b.used_days / b.max_days_per_year) * 100));

          return (
            <div key={b.leave_type_id}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-xs text-off-white">
                  {b.leave_type_name}
                </span>
                <span className="text-xs tabular-nums text-muted-gray">
                  {b.max_days_per_year === null
                    ? `${b.used_days} used`
                    : `${b.used_days} / ${b.max_days_per_year}`}
                </span>
              </div>
              {pct !== null && (
                <div className="h-1.5 rounded-full bg-charcoal-3 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all')}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: b.leave_type_color,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}
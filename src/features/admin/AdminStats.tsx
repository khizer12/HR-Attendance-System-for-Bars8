import { Card } from '@/components/ui/Card';
import type { AdminOverviewRow } from '@/features/admin';
import { cn } from '@/utils/cn';

interface AdminStatsProps {
  rows: AdminOverviewRow[];
}

interface StatItem {
  label: string;
  value: number;
  tone: 'default' | 'success' | 'warning' | 'muted';
}

const TONE_VALUE: Record<StatItem['tone'], string> = {
  default: 'text-off-white',
  success: 'text-success',
  warning: 'text-warning',
  muted: 'text-muted-gray',
};

export function AdminStats({ rows }: AdminStatsProps) {
  const total = rows.length;
  const working = rows.filter(
    (r) => r.state === 'CHECKED_IN' || r.state === 'BACK_FROM_BREAK',
  ).length;
  const onBreak = rows.filter((r) => r.state === 'ON_BREAK').length;
  const checkedOut = rows.filter((r) => r.state === 'CHECKED_OUT').length;
  const notIn = rows.filter((r) => r.state === 'NOT_CHECKED_IN').length;

  const stats: StatItem[] = [
    { label: 'Total', value: total, tone: 'default' },
    { label: 'Working', value: working, tone: 'success' },
    { label: 'On break', value: onBreak, tone: 'warning' },
    { label: 'Checked out', value: checkedOut, tone: 'muted' },
    { label: 'Not checked in', value: notIn, tone: 'muted' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-4">
          <p className="text-xs text-muted-gray mb-1">{s.label}</p>
          <p
            className={cn(
              'font-heading text-2xl font-semibold tabular-nums',
              TONE_VALUE[s.tone],
            )}
          >
            {s.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
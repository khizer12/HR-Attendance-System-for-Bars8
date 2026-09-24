import { SkeletonRow } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { LeaderboardRow } from '@/features/racing/leaderboardApi';

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  loading: boolean;
  error: string | null;
  selfId: string | null;
  /** Header text shown above the table (e.g. "Mon 15 Sep – Fri 19 Sep"). */
  rangeLabel?: string;
  /** When true, no rows means "not enough data yet" rather than "no activity". */
  weeklyMode?: boolean;
}

function rankBadgeColor(rank: number): string {
  if (rank === 1) return 'bg-warning/20 text-warning';
  if (rank === 2) return 'bg-charcoal-3 text-off-white';
  if (rank === 3) return 'bg-danger/15 text-danger';
  return 'bg-charcoal-2 text-muted-gray';
}

function formatUsd(n: number): string {
  if (n === 0) return '—';
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function LeaderboardTable({
  rows,
  loading,
  error,
  selfId,
  rangeLabel,
  weeklyMode = false,
}: LeaderboardTableProps) {
  if (error) {
    return (
      <div className="px-5 py-6 text-center">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-5 py-2">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-gray">
          {weeklyMode
            ? 'No weekly standings yet. The first release is at 19:30 on Friday.'
            : 'No completed races in this range yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {rangeLabel && (
        <div className="px-5 pt-3 pb-2 text-xs text-muted-gray">
          {rangeLabel}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-gray border-b border-charcoal-3">
            <th scope="col" className="font-medium py-2.5 pl-5 pr-3 w-12">
              #
            </th>
            <th scope="col" className="font-medium py-2.5 pr-3">
              Racer
            </th>
            <th
              scope="col"
              className="font-medium py-2.5 pr-3 tabular-nums hidden md:table-cell"
            >
              Worked
            </th>
            <th
              scope="col"
              className="font-medium py-2.5 pr-3 tabular-nums hidden lg:table-cell"
            >
              Deposits
            </th>
            <th
              scope="col"
              className="font-medium py-2.5 pr-3 tabular-nums hidden lg:table-cell"
            >
              Boost
            </th>
            <th
              scope="col"
              className="font-medium py-2.5 pr-5 tabular-nums text-right"
            >
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isSelf = r.user_id === selfId;
            const laps = Math.floor(r.work_minutes / 60);
            const mins = r.work_minutes % 60;

            return (
              <tr
                key={r.user_id}
                className={cn(
                  'border-b border-charcoal-3/60 last:border-0 transition-colors',
                  isSelf ? 'bg-lime/[0.06]' : 'hover:bg-charcoal-2/40',
                )}
              >
                <td className="py-3 pl-5 pr-3">
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
                      rankBadgeColor(r.rank),
                    )}
                  >
                    {r.rank}
                  </span>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {r.car_color && (
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 rounded border border-charcoal-3 shrink-0"
                        style={{ backgroundColor: r.car_color }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-off-white truncate">
                        {r.display_name}
                        {isSelf && (
                          <span className="text-muted-gray"> (you)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-gray truncate">
                        {r.car_name ?? 'No car selected'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-3 tabular-nums text-off-white text-xs hidden md:table-cell">
                  {laps > 0 ? `${laps} lap${laps === 1 ? '' : 's'} · ` : ''}
                  {mins}m
                </td>
                <td className="py-3 pr-3 tabular-nums text-xs hidden lg:table-cell text-muted-gray">
                  {formatUsd(r.deposit_usd)}
                </td>
                <td className="py-3 pr-3 tabular-nums text-xs hidden lg:table-cell">
                  {r.boost_minutes > 0 ? (
                    <span className="text-lime">+{r.boost_minutes}m</span>
                  ) : (
                    <span className="text-muted-gray">—</span>
                  )}
                </td>
                <td className="py-3 pr-5 tabular-nums text-right">
                  <span className="text-sm font-medium text-off-white">
                    {r.score_minutes}m
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
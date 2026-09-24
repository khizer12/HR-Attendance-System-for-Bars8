import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import { useLeaderboard } from '@/features/racing';
import { cn } from '@/utils/cn';

/**
 * Compact top-5 "daily" leaderboard for the admin dashboard.
 * Uses the same daily range as the full leaderboard's Daily tab.
 */
export function TodayStandingsCard() {
  const { profile } = useAuth();
  const { rows, loading, error } = useLeaderboard('daily');

  const visible = rows.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s standings</CardTitle>
        <p className="text-xs text-muted-gray mt-1">
          Top 5 · ranked by work time + deposit boost
        </p>
      </CardHeader>
      <CardBody className="p-0">
        {error ? (
          <div className="px-5 py-6">
            <p className="text-xs text-danger">{error}</p>
          </div>
        ) : loading ? (
          <div className="px-5 py-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-gray">
              No completed races yet today.
            </p>
            <p className="text-xs text-muted-gray mt-1">
              Standings update when racers park in the garage.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-charcoal-3">
            {visible.map((r) => {
              const isSelf = r.user_id === profile?.id;
              return (
                <li
                  key={r.user_id}
                  className={cn(
                    'px-5 py-2.5 flex items-center gap-3',
                    isSelf && 'bg-lime/[0.06]',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
                      r.rank === 1
                        ? 'bg-warning/20 text-warning'
                        : r.rank === 2
                          ? 'bg-charcoal-3 text-off-white'
                          : r.rank === 3
                            ? 'bg-danger/15 text-danger'
                            : 'bg-charcoal-2 text-muted-gray',
                    )}
                  >
                    {r.rank}
                  </span>

                  {r.car_color && (
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 rounded border border-charcoal-3"
                      style={{ backgroundColor: r.car_color }}
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-off-white truncate">
                      {r.display_name}
                      {isSelf && <span className="text-muted-gray"> (you)</span>}
                    </p>
                    <p className="text-xs text-muted-gray truncate">
                      {r.car_name ?? 'No car'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs tabular-nums text-off-white">
                      {r.score_minutes}m
                    </p>
                    {r.boost_minutes > 0 && (
                      <p className="text-[10px] tabular-nums text-lime">
                        +{r.boost_minutes}m boost
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

import { cn } from '@/utils/cn';
import type { LeaderboardRange } from '@/features/racing/leaderboardApi';

interface LeaderboardTabsProps {
  current: LeaderboardRange;
  onChange: (next: LeaderboardRange) => void;
}

const TABS: Array<{ id: LeaderboardRange; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: '3mo', label: '3 months' },
  { id: '6mo', label: '6 months' },
  { id: 'yearly', label: 'Yearly' },
];

export function LeaderboardTabs({ current, onChange }: LeaderboardTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Leaderboard range"
      className="flex flex-wrap gap-2"
    >
      {TABS.map((t) => {
        const isActive = current === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            className={cn(
              'inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-near-black',
              isActive
                ? 'bg-lime text-ink'
                : 'bg-charcoal-2 text-muted-gray hover:text-off-white hover:bg-charcoal-3',
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// Re-export type for convenience
export type { LeaderboardRange };
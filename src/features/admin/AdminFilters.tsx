import { cn } from '@/utils/cn';
import type { AdminFilter } from '@/features/admin/filters';

interface AdminFiltersProps {
  current: AdminFilter;
  onChange: (next: AdminFilter) => void;
  counts: Record<AdminFilter, number>;
}

const FILTERS: Array<{ id: AdminFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'working', label: 'Working' },
  { id: 'on_break', label: 'On break' },
  { id: 'not_checked_in', label: 'Not checked in' },
  { id: 'checked_out', label: 'Checked out' },
];

export function AdminFilters({ current, onChange, counts }: AdminFiltersProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter employees by status"
      className="flex flex-wrap gap-2"
    >
      {FILTERS.map((f) => {
        const isActive = current === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-near-black',
              isActive
                ? 'bg-lime text-near-black'
                : 'bg-charcoal-2 text-muted-gray hover:text-off-white hover:bg-charcoal-3',
            )}
          >
            <span>{f.label}</span>
            <span
              className={cn(
                'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums',
                isActive
                  ? 'bg-near-black/20 text-near-black'
                  : 'bg-charcoal-4 text-off-white',
              )}
            >
              {counts[f.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
import type { HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/**
 * Skeleton placeholder. Uses the existing `animate-skeleton` keyframe
 * from globals.css (respects prefers-reduced-motion globally).
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded bg-charcoal-3/60 animate-skeleton',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A skeleton row mimicking a table/list entry: two stacked lines on the
 * left, a short pill on the right. Used by list and table loaders.
 */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-3', className)}>
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}
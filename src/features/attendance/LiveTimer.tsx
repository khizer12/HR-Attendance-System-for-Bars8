import { cn } from '@/utils/cn';
import { useNow } from '@/hooks/useNow';
import { formatElapsed, secondsBetween } from '@/lib/time';

interface LiveTimerProps {
  /** ISO timestamp to count from. Null disables the timer. */
  since: string | null;
  /** Optional label prefix, e.g. "On break for". */
  label?: string;
  /** Optional className for layout integration. */
  className?: string;
  /** Text color override. */
  tone?: 'default' | 'muted' | 'lime' | 'warning';
}

const TONE_CLASSES = {
  default: 'text-off-white',
  muted: 'text-muted-gray',
  lime: 'text-lime',
  warning: 'text-warning',
} as const;

export function LiveTimer({
  since,
  label,
  className,
  tone = 'default',
}: LiveTimerProps) {
  // Only tick when there's something to count.
  const now = useNow(1000, since !== null);

  if (since === null) {
    return (
      <span className={cn('text-sm text-muted-gray', className)}>—</span>
    );
  }

  const seconds = secondsBetween(since, now);

  return (
    <span className={cn('text-sm font-medium tabular-nums', TONE_CLASSES[tone], className)}>
      {label && <span className="text-muted-gray mr-1.5">{label}</span>}
      {formatElapsed(seconds)}
    </span>
  );
}
/** Format a Postgres `time` value ("HH:MM:SS") as "HH:MM". */
export function formatTimeOfDay(t: string): string {
  const parts = t.split(':');
  if (parts.length < 2) return t;
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

/** DOW index → short name. 0=Sun. */
export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Format working days for display: "Mon–Fri" when contiguous, else comma list.
 */
export function formatWorkingDays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 0) return 'None';
  if (sorted.length === 7) return 'Every day';

  // Check for contiguous Monday–Friday.
  const mondayToFriday = [1, 2, 3, 4, 5];
  if (
    sorted.length === 5 &&
    mondayToFriday.every((d) => sorted.includes(d))
  ) {
    return 'Mon–Fri';
  }

  // Check for any contiguous run.
  let isContiguous = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      isContiguous = false;
      break;
    }
  }
  if (isContiguous && sorted.length > 2) {
    return `${DOW_SHORT[sorted[0]]}–${DOW_SHORT[sorted[sorted.length - 1]]}`;
  }

  return sorted.map((d) => DOW_SHORT[d]).join(', ');
}
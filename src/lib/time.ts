import { formatInTimeZone } from 'date-fns-tz';

import { BUSINESS_TIMEZONE } from '@/lib/constants';

/**
 * All functions here display time in the business timezone (Asia/Dubai).
 * Never use the browser's local timezone for business logic or display.
 */

/** Format an ISO timestamp or Date as "HH:mm" in business time. */
export function formatTime(value: string | Date): string {
  return formatInTimeZone(value, BUSINESS_TIMEZONE, 'HH:mm');
}

/** Format as "HH:mm:ss" in business time. */
export function formatTimeLong(value: string | Date = new Date()): string {
  return formatInTimeZone(value, BUSINESS_TIMEZONE, 'HH:mm:ss');
}

/** Format as "EEE, MMM d" in business time. */
export function formatDateShort(value: string | Date = new Date()): string {
  return formatInTimeZone(value, BUSINESS_TIMEZONE, 'EEE, MMM d');
}

/** Format as "EEEE, MMMM d, yyyy" in business time. */
export function formatDateLong(value: string | Date = new Date()): string {
  return formatInTimeZone(value, BUSINESS_TIMEZONE, 'EEEE, MMMM d, yyyy');
}

/** Return today's date as YYYY-MM-DD in business time. */
export function todayInBusinessTz(now: Date = new Date()): string {
  return formatInTimeZone(now, BUSINESS_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Format a positive number of minutes as "1h 30m", "45m", or "2h".
 * Negative or invalid inputs are clamped to 0.
 */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Compute minutes between two ISO timestamps.
 * Always returns a non-negative number. Impossible intervals return 0.
 */
export function minutesBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.round((to - from) / 60_000));
}

/** Time-of-day greeting in business time. */
export function greetingForNow(now: Date = new Date()): string {
  const hour = Number(formatInTimeZone(now, BUSINESS_TIMEZONE, 'H'));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
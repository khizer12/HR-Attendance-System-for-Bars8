/**
 * Business-wide constants. Single source of truth.
 * Anything here must not be hard-coded elsewhere.
 */

/** Business timezone. All attendance reasoning uses this, not the browser's. */
export const BUSINESS_TIMEZONE = 'Asia/Dubai';

/** App display name. */
export const APP_NAME = 'HR Attendance';

/** Default working window (used only as a display fallback until schedules exist). */
export const DEFAULT_WORK_START = '10:30';
export const DEFAULT_WORK_END = '19:30';

/** Default grace period before clock-in counts as late. */
export const DEFAULT_GRACE_PERIOD_MINUTES = 10;

/** Default periodic location verification interval. */
export const DEFAULT_VERIFICATION_INTERVAL_MINUTES = 30;

/** How many recent rows the employee dashboard shows in the history list. */
export const DASHBOARD_HISTORY_LIMIT = 7;
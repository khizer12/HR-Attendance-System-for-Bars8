import { useCallback, useEffect, useState } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

const STORAGE_KEY = 'hr-attendance:notification-prompt-dismissed';

export interface UseNotificationPermissionResult {
  /** Current browser permission state. */
  permission: NotificationPermission;
  /** True when the browser supports the Notifications API. */
  supported: boolean;
  /** True if the user has dismissed the prompt and we should stop asking. */
  dismissed: boolean;
  /** Ask the browser for permission. Returns the resulting permission. */
  request: () => Promise<NotificationPermission>;
  /** Remember that the user dismissed our in-app prompt (they may still allow later via browser settings). */
  dismissPrompt: () => void;
}

function readCurrentPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermission;
}

/**
 * Track and request browser notification permission.
 *
 * Does NOT auto-prompt on mount — browsers penalize that. Callers show
 * a small in-app banner the user can act on.
 */
export function useNotificationPermission(): UseNotificationPermissionResult {
  const [permission, setPermission] = useState<NotificationPermission>(
    readCurrentPermission,
  );
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Poll permission periodically. Chrome doesn't fire an event on
  // permission change in every case, so a lightweight interval keeps
  // us in sync without depending on the Permissions API quirks.
  useEffect(() => {
    if (permission === 'unsupported' || permission === 'denied') return;

    const id = window.setInterval(() => {
      const current = readCurrentPermission();
      setPermission((prev) => (prev === current ? prev : current));
    }, 10_000);

    return () => window.clearInterval(id);
  }, [permission]);

  const request = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result as NotificationPermission;
    } catch {
      return 'denied';
    }
  }, []);

  const dismissPrompt = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // storage unavailable — non-fatal
    }
    setDismissed(true);
  }, []);

  return {
    permission,
    supported: permission !== 'unsupported',
    dismissed,
    request,
    dismissPrompt,
  };
}
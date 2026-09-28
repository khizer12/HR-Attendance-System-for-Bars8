import { useCallback, useEffect, useState } from 'react';

import { env } from '@/lib/env';
import {
  deletePushSubscription,
  savePushSubscription,
} from '@/features/notifications/pushApi';

export type WebPushState =
  | 'unsupported' // browser doesn't support SW or Push
  | 'idle' // supported, not subscribed
  | 'subscribed' // active subscription saved in DB
  | 'error';

export interface UseWebPushResult {
  state: WebPushState;
  loading: boolean;
  error: string | null;
  /** Subscribe the current browser. Registers the SW if needed. */
  subscribe: () => Promise<void>;
  /** Unsubscribe and delete the DB row. */
  unsubscribe: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Manage a Web Push subscription for the current browser.
 *
 * On mount, checks whether this device already has an active
 * subscription. Does NOT auto-subscribe — the user must click a
 * button, since Chrome/Edge now require a user gesture for the
 * first subscription request.
 */
export function useWebPush(): UseWebPushResult {
  const [state, setState] = useState<WebPushState>(() =>
    isSupported() ? 'idle' : 'unsupported',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, check existing subscription.
  useEffect(() => {
    if (!isSupported()) return;
    let cancelled = false;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/');
        if (!reg) return;
        const existing = await reg.pushManager.getSubscription();
        if (!cancelled && existing) {
          setState('subscribed');
        }
      } catch {
        // Non-fatal — we just show 'idle'
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setLoading(true);

    if (!isSupported()) {
      setError('This browser does not support push notifications.');
      setState('unsupported');
      setLoading(false);
      return;
    }

    try {
      // 1. Register the service worker (idempotent).
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;

      // 2. Request notification permission if we don't have it.
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
          throw new Error('Notification permission was not granted.');
        }
      }

      // 3. Subscribe via PushManager.
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(env.VITE_VAPID_PUBLIC_KEY),
        });
      }

      // 4. Save to the DB.
      await savePushSubscription(sub);

      setState('subscribed');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to enable background push.',
      );
      setState('error');
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        setState('idle');
        return;
      }
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Delete from DB first so the row goes even if the browser
        // call fails.
        try {
          await deletePushSubscription(sub.endpoint);
        } catch {
          // Non-fatal
        }
        await sub.unsubscribe();
      }
      setState('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable push.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, loading, error, subscribe, unsubscribe };
}
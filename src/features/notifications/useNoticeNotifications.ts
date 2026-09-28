import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';

/**
 * Subscribe to `notices` INSERT events. When one arrives:
 *   - Skip if it's the current user's own notice (they just posted it).
 *   - Fire a native OS notification (if permission is granted).
 *   - Clicking the notification focuses the tab and navigates to /notices.
 *
 * Only active when permission === 'granted'. Silently a no-op otherwise.
 *
 * NOTE: This is Tier 1 only — it requires at least one tab of the app
 * to be open somewhere. Background push (Tier 2) is a separate hook
 * that will use a service worker.
 */
export function useNoticeNotifications(permission: NotificationPermission | string): void {
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (permission !== 'granted') return;
    if (!profile) return;

    const channel = supabase
      .channel('notice-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notices',
        },
        (payload) => {
          type NewRow = {
            id: string;
            author_id: string;
            title: string;
            body: string;
          };
          const row = payload.new as NewRow;

          // Skip our own notices.
          if (row.author_id === profile.id) return;

          // Fire the OS notification.
          try {
            const notif = new Notification(`Notice: ${row.title}`, {
              body: row.body.slice(0, 180),
              tag: `notice-${row.id}`,
              icon: '/favicon.svg',
              silent: false,
            });

            notif.onclick = () => {
              window.focus();
              navigate('/notices');
              notif.close();
            };
          } catch {
            // Some browsers throw if the tab isn't focused in certain
            // contexts. Swallow — the notice still appears on the board.
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [permission, profile, navigate]);
}
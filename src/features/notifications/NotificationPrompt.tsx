import { Bell, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { PushToggle } from '@/features/notifications/PushToggle';
import { useNotificationPermission } from '@/features/notifications/useNotificationPermission';
import { useWebPush } from '@/features/notifications/useWebPush';

/**
 * Two-row prompt:
 *   1. Enables Tier-1 (in-app / tab-open) notifications.
 *   2. Offers Tier-2 (background push) via PushToggle.
 *
 * Tier 1 must be granted before Tier 2 makes sense, so the PushToggle
 * is only rendered once Tier-1 permission is 'granted'.
 */
export function NotificationPrompt() {
  const { supported, permission, dismissed, request, dismissPrompt } =
    useNotificationPermission();
  const { state: pushState } = useWebPush();

  // Hide entirely if unsupported OR already fully configured.
  if (!supported) return null;

  const tier1Pending = permission === 'default' && !dismissed;
  const tier2Pending = permission === 'granted' && pushState === 'idle';

  if (!tier1Pending && !tier2Pending) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="px-4 lg:px-6 py-3 bg-chrome-2 border-b border-chrome-3 flex items-center gap-3"
        role="region"
        aria-label="Enable notifications"
      >
        <Bell className="h-4 w-4 text-lime shrink-0" aria-hidden="true" />

        {tier1Pending ? (
          <>
            <p className="text-xs text-off-white flex-1">
              Enable notifications so you know when new notices arrive.
            </p>
            <Button size="sm" variant="primary" onClick={() => void request()}>
              Enable
            </Button>
            <button
              type="button"
              onClick={dismissPrompt}
              aria-label="Dismiss"
              className="text-muted-gray hover:text-off-white transition-colors p-1"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-off-white flex-1">
              Enable <strong>background push</strong> so notices reach you
              even when the app is closed.
            </p>
            <PushToggle />
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
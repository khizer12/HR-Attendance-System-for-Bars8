import { Bell, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { useNotificationPermission } from '@/features/notifications/useNotificationPermission';

/**
 * In-app prompt asking the user to enable OS notifications. Shows once;
 * if the user dismisses it, we persist that and never nag again (they can
 * still enable it via browser settings).
 *
 * Rendered inside MainLayout, above the header.
 */
export function NotificationPrompt() {
  const { supported, permission, dismissed, request, dismissPrompt } =
    useNotificationPermission();

  const shouldShow =
    supported &&
    permission === 'default' &&
    !dismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
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
          <p className="text-xs text-off-white flex-1">
            Enable notifications to know about new notices instantly.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => void request()}
          >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import { Bell, BellOff, BellRing } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useWebPush } from '@/features/notifications';

/**
 * Explicit toggle for background push notifications.
 *
 * Two-tier model:
 *   - Tier 1 (in-app) fires automatically when a tab is open.
 *   - Tier 2 (this toggle) enables background push — works even
 *     when the browser is closed.
 *
 * Lives inside the header's right-hand menu area, or the notices page.
 */
export function PushToggle() {
  const { state, loading, error, subscribe, unsubscribe } = useWebPush();

  if (state === 'unsupported') {
    return (
      <span className="text-[10px] text-muted-gray uppercase tracking-wider">
        Push unsupported
      </span>
    );
  }

  if (state === 'subscribed') {
    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium text-lime"
          title="Background push enabled for this device"
        >
          <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
          Background on
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void unsubscribe()}
          loading={loading}
        >
          Turn off
        </Button>
        {error && <span className="text-[10px] text-danger">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium text-muted-gray"
        title="Notifications only work while a tab is open"
      >
        <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
        Background off
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => void subscribe()}
        loading={loading}
      >
        <Bell className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
        Enable background
      </Button>
      {error && <span className="text-[10px] text-danger">{error}</span>}
    </div>
  );
}
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  BUSINESS_TIMEZONE,
  DEFAULT_WORK_END,
  DEFAULT_WORK_START,
} from '@/lib/constants';
import { formatDateLong } from '@/lib/time';

export function ScheduleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s schedule</CardTitle>
        <p className="text-xs text-muted-gray mt-1">
          {formatDateLong()}
        </p>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-gray">Working hours</span>
          <span className="text-sm font-medium text-off-white">
            {DEFAULT_WORK_START} – {DEFAULT_WORK_END}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-gray">Timezone</span>
          <span className="text-sm font-medium text-off-white">
            {BUSINESS_TIMEZONE}
          </span>
        </div>

        <div className="pt-2 border-t border-charcoal-3">
          <p className="text-xs text-muted-gray">
            Assigned schedules and per-day rosters arrive in Phase 9.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
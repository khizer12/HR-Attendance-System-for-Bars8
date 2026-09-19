import { useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import {
  createSchedule,
  updateSchedule,
  type Schedule,
} from '@/features/schedules/api';
import { ScheduleForm } from '@/features/schedules/ScheduleForm';
import {
  SCHEDULE_DEFAULTS,
  type ScheduleFormValues,
} from '@/features/schedules/scheduleForm.defaults';
import { formatTimeOfDay } from '@/features/schedules/labels';

interface ScheduleModalProps {
  open: boolean;
  /** null = create mode */
  schedule: Schedule | null;
  onClose: () => void;
  onSaved: () => void;
}

function scheduleToFormValues(s: Schedule): ScheduleFormValues {
  return {
    name: s.name,
    start_time: formatTimeOfDay(s.start_time),
    end_time: formatTimeOfDay(s.end_time),
    working_days: [...s.working_days].sort((a, b) => a - b),
    grace_period_minutes: s.grace_period_minutes,
    break_required: s.break_required,
    min_break_minutes: s.min_break_minutes,
    max_break_minutes: s.max_break_minutes,
    location_required: s.location_required,
    verification_interval_minutes: s.verification_interval_minutes,
    active: s.active,
  };
}

export function ScheduleModal({
  open,
  schedule,
  onClose,
  onSaved,
}: ScheduleModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={schedule ? 'Edit schedule' : 'Add schedule'}
      description={
        schedule
          ? 'Changes apply to future clock-ins.'
          : 'Define working hours, days, and rules.'
      }
    >
      <ScheduleModalBody
        key={schedule?.id ?? 'new'}
        schedule={schedule}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}

interface ScheduleModalBodyProps {
  schedule: Schedule | null;
  onClose: () => void;
  onSaved: () => void;
}

function ScheduleModalBody({
  schedule,
  onClose,
  onSaved,
}: ScheduleModalBodyProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = schedule
    ? scheduleToFormValues(schedule)
    : SCHEDULE_DEFAULTS;

  async function handleSubmit(values: ScheduleFormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        start_time: values.start_time,
        end_time: values.end_time,
        working_days: values.working_days,
        grace_period_minutes: values.grace_period_minutes,
        break_required: values.break_required,
        min_break_minutes: values.break_required ? values.min_break_minutes : null,
        max_break_minutes: values.break_required ? values.max_break_minutes : null,
        location_required: values.location_required,
        verification_interval_minutes: values.verification_interval_minutes,
        active: values.active,
      };

      if (schedule) {
        await updateSchedule(schedule.id, payload);
      } else {
        await createSchedule(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save schedule.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScheduleForm
      initial={initial}
      submitLabel={schedule ? 'Save changes' : 'Create schedule'}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onCancel={() => {
        if (!submitting) onClose();
      }}
    />
  );
}
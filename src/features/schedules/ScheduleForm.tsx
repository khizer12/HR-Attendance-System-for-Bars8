import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { DOW_SHORT } from '@/features/schedules/labels';
import type { ScheduleFormValues } from '@/features/schedules/scheduleForm.defaults';

interface ScheduleFormProps {
  initial: ScheduleFormValues;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: ScheduleFormValues) => void;
  onCancel: () => void;
}

export function ScheduleForm({
  initial,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
}: ScheduleFormProps) {
  const [values, setValues] = useState<ScheduleFormValues>(initial);
  const [localError, setLocalError] = useState<string | null>(null);

  function update<K extends keyof ScheduleFormValues>(
    key: K,
    value: ScheduleFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(idx: number) {
    const has = values.working_days.includes(idx);
    const next = has
      ? values.working_days.filter((d) => d !== idx)
      : [...values.working_days, idx].sort((a, b) => a - b);
    update('working_days', next);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);

    if (values.name.trim().length < 2) {
      setLocalError('Schedule name is required.');
      return;
    }
    if (values.working_days.length === 0) {
      setLocalError('Select at least one working day.');
      return;
    }
    if (values.end_time <= values.start_time) {
      setLocalError('End time must be after start time (overnight not supported).');
      return;
    }
    if (values.grace_period_minutes < 0) {
      setLocalError('Grace period cannot be negative.');
      return;
    }
    if (values.verification_interval_minutes < 1) {
      setLocalError('Verification interval must be at least 1 minute.');
      return;
    }
    if (values.break_required) {
      if (
        values.min_break_minutes !== null &&
        values.max_break_minutes !== null &&
        values.max_break_minutes < values.min_break_minutes
      ) {
        setLocalError('Max break minutes must be ≥ min break minutes.');
        return;
      }
    }

    onSubmit({ ...values, name: values.name.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Name"
        value={values.name}
        onChange={(e) => update('name', e.target.value)}
        disabled={submitting}
        placeholder="e.g. Standard Mon–Fri 10:30 – 19:30"
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start time"
          type="time"
          value={values.start_time}
          onChange={(e) => update('start_time', e.target.value)}
          disabled={submitting}
          required
        />
        <Input
          label="End time"
          type="time"
          value={values.end_time}
          onChange={(e) => update('end_time', e.target.value)}
          disabled={submitting}
          required
        />
      </div>

      <div>
        <p className="block text-xs font-medium text-off-white mb-1.5">
          Working days
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DOW_SHORT.map((label, idx) => {
            const isActive = values.working_days.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                disabled={submitting}
                aria-pressed={isActive}
                className={cn(
                  'h-9 min-w-11 rounded-md border text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal',
                  isActive
                    ? 'bg-lime text-near-black border-lime'
                    : 'bg-charcoal-2 text-muted-gray border-charcoal-3 hover:text-off-white hover:bg-charcoal-3',
                  submitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Grace period (minutes)"
          type="number"
          min={0}
          value={String(values.grace_period_minutes)}
          onChange={(e) =>
            update('grace_period_minutes', Math.max(0, Number(e.target.value) || 0))
          }
          disabled={submitting}
          hint="Minutes after start before late."
        />
        <Input
          label="Verification interval (min)"
          type="number"
          min={1}
          value={String(values.verification_interval_minutes)}
          onChange={(e) =>
            update(
              'verification_interval_minutes',
              Math.max(1, Number(e.target.value) || 1),
            )
          }
          disabled={submitting}
          hint="Location check frequency (Phase 11)."
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={values.break_required}
          onChange={(e) => update('break_required', e.target.checked)}
          disabled={submitting}
          className="mt-1 h-4 w-4 rounded border-charcoal-3 bg-charcoal-2 text-lime focus:ring-lime focus:ring-offset-charcoal"
        />
        <span>
          <span className="block text-sm text-off-white">Break required</span>
          <span className="block text-xs text-muted-gray">
            Minimum break the employee must take each day.
          </span>
        </span>
      </label>

      {values.break_required && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Min break (min)"
            type="number"
            min={0}
            value={
              values.min_break_minutes === null
                ? ''
                : String(values.min_break_minutes)
            }
            onChange={(e) => {
              const v = e.target.value;
              update('min_break_minutes', v === '' ? null : Number(v));
            }}
            disabled={submitting}
            placeholder="e.g. 30"
          />
          <Input
            label="Max break (min)"
            type="number"
            min={0}
            value={
              values.max_break_minutes === null
                ? ''
                : String(values.max_break_minutes)
            }
            onChange={(e) => {
              const v = e.target.value;
              update('max_break_minutes', v === '' ? null : Number(v));
            }}
            disabled={submitting}
            placeholder="Leave blank for unlimited"
          />
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={values.location_required}
          onChange={(e) => update('location_required', e.target.checked)}
          disabled={submitting}
          className="mt-1 h-4 w-4 rounded border-charcoal-3 bg-charcoal-2 text-lime focus:ring-lime focus:ring-offset-charcoal"
        />
        <span>
          <span className="block text-sm text-off-white">Location required</span>
          <span className="block text-xs text-muted-gray">
            Requires browser geolocation on clock-in (Phase 11).
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(e) => update('active', e.target.checked)}
          disabled={submitting}
          className="mt-1 h-4 w-4 rounded border-charcoal-3 bg-charcoal-2 text-lime focus:ring-lime focus:ring-offset-charcoal"
        />
        <span>
          <span className="block text-sm text-off-white">Active</span>
          <span className="block text-xs text-muted-gray">
            Inactive schedules can&apos;t be assigned to employees.
          </span>
        </span>
      </label>

      {(error || localError) && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {error ?? localError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
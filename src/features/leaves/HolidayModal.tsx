import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  createHoliday,
  updateHoliday,
} from '@/features/leaves/holidayApi';
import type { Holiday } from '@/types/leave';

interface HolidayModalProps {
  open: boolean;
  holiday: Holiday | null;
  onClose: () => void;
  onSaved: () => void;
}

export function HolidayModal({
  open,
  holiday,
  onClose,
  onSaved,
}: HolidayModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={holiday ? 'Edit holiday' : 'Add holiday'}
      description="Non-working day for the whole company."
    >
      <HolidayForm
        key={holiday?.id ?? 'new'}
        holiday={holiday}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}

interface FormProps {
  holiday: Holiday | null;
  onClose: () => void;
  onSaved: () => void;
}

function HolidayForm({ holiday, onClose, onSaved }: FormProps) {
  const [name, setName] = useState(holiday?.name ?? '');
  const [date, setDate] = useState(holiday?.date ?? '');
  const [description, setDescription] = useState(holiday?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Name is required.');
      return;
    }
    if (!date) {
      setError('Date is required.');
      return;
    }

    setSubmitting(true);
    try {
      const input = { name, date, description: description || null };
      if (holiday) {
        await updateHoliday(holiday.id, input);
      } else {
        await createHoliday(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save holiday.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={submitting}
        placeholder="e.g. Eid al-Fitr"
        required
      />
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        disabled={submitting}
        required
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={submitting}
        hint="Optional. Shown next to the holiday name."
      />

      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {holiday ? 'Save changes' : 'Add holiday'}
        </Button>
      </div>
    </form>
  );
}
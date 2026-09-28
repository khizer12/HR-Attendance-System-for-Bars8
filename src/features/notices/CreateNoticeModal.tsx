import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { createNotice } from '@/features/notices';
import { cn } from '@/utils/cn';

interface CreateNoticeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateNoticeModal({
  open,
  onClose,
  onCreated,
}: CreateNoticeModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle('');
    setBody('');
    setPinned(false);
    setError(null);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 1) {
      setError('Title is required.');
      return;
    }
    if (body.trim().length < 1) {
      setError('Body is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createNotice({ title, body, pinned });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post notice.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Post a notice"
      description="Visible to every signed-in user immediately."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          maxLength={200}
          required
        />

        <div>
          <label
            htmlFor="notice-body"
            className="block text-xs font-medium text-off-white mb-1.5"
          >
            Body
          </label>
          <textarea
            id="notice-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={submitting}
            maxLength={10000}
            rows={6}
            className={cn(
              'w-full rounded-md bg-charcoal-2 text-off-white text-sm px-3 py-2',
              'border border-charcoal-3',
              'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime/60',
              'disabled:opacity-50',
              'resize-y',
            )}
            required
          />
          <p className="text-xs text-muted-gray mt-1">
            {body.length} / 10000
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            disabled={submitting}
            className="mt-1 h-4 w-4 rounded border-charcoal-3 bg-charcoal-2 text-lime focus:ring-lime focus:ring-offset-charcoal"
          />
          <span>
            <span className="block text-sm text-off-white">Pin to top</span>
            <span className="block text-xs text-muted-gray">
              Pinned notices sort above the rest and show a ★ badge.
            </span>
          </span>
        </label>

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
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Post notice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
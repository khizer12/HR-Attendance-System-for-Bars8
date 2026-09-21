import { useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import {
  createOfficeLocation,
  updateOfficeLocation,
} from '@/features/settings/api';
import { OfficeLocationForm } from '@/features/settings/OfficeLocationForm';
import {
  OFFICE_FORM_DEFAULTS,
  parseOfficeForm,
  type OfficeFormValues,
} from '@/features/settings/officeForm.defaults';
import type { OfficeLocation } from '@/types/location';

interface OfficeLocationModalProps {
  open: boolean;
  /** null = create mode */
  office: OfficeLocation | null;
  onClose: () => void;
  onSaved: () => void;
}

function officeToFormValues(o: OfficeLocation): OfficeFormValues {
  return {
    name: o.name,
    latitude: String(o.latitude),
    longitude: String(o.longitude),
    radius_meters: String(o.radius_meters),
  };
}

export function OfficeLocationModal({
  open,
  office,
  onClose,
  onSaved,
}: OfficeLocationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={office ? 'Edit office location' : 'Add office location'}
      description={
        office
          ? 'Coordinates and radius are used by geofenced clock-in.'
          : 'Define a location. Activate it from the list when ready.'
      }
    >
      <OfficeLocationModalBody
        key={office?.id ?? 'new'}
        office={office}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}

interface BodyProps {
  office: OfficeLocation | null;
  onClose: () => void;
  onSaved: () => void;
}

function OfficeLocationModalBody({ office, onClose, onSaved }: BodyProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = office ? officeToFormValues(office) : OFFICE_FORM_DEFAULTS;

  async function handleSubmit(values: OfficeFormValues) {
    setError(null);
    const parsed = parseOfficeForm(values);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setSubmitting(true);
    try {
      if (office) {
        await updateOfficeLocation(office.id, parsed.value);
      } else {
        await createOfficeLocation(parsed.value);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to save office location.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OfficeLocationForm
      initial={initial}
      submitLabel={office ? 'Save changes' : 'Create office'}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onCancel={() => {
        if (!submitting) onClose();
      }}
    />
  );
}
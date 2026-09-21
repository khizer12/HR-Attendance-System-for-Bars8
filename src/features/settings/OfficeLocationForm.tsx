import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getBrowserLocation, isGeolocationSupported } from '@/features/location';
import {
  parseOfficeForm,
  type OfficeFormValues,
} from '@/features/settings/officeForm.defaults';

interface OfficeLocationFormProps {
  initial: OfficeFormValues;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: OfficeFormValues) => void;
  onCancel: () => void;
}

export function OfficeLocationForm({
  initial,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
}: OfficeLocationFormProps) {
  const [values, setValues] = useState<OfficeFormValues>(initial);
  const [localError, setLocalError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  function update<K extends keyof OfficeFormValues>(
    key: K,
    value: OfficeFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleUseMyLocation() {
    setLocalError(null);
    setLocating(true);
    try {
      const result = await getBrowserLocation();
      if (!result.ok) {
        setLocalError(
          result.status === 'permission_denied'
            ? 'Location permission denied. Enable it in your browser settings.'
            : `Could not get your location: ${result.message}`,
        );
        return;
      }
      setValues((prev) => ({
        ...prev,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
      }));
    } finally {
      setLocating(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);

    const parsed = parseOfficeForm(values);
    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }

    onSubmit({
      name: parsed.value.name,
      latitude: String(parsed.value.latitude),
      longitude: String(parsed.value.longitude),
      radius_meters: String(parsed.value.radius_meters),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Name"
        value={values.name}
        onChange={(e) => update('name', e.target.value)}
        disabled={submitting}
        placeholder="e.g. Head Office"
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Latitude"
          type="number"
          step="any"
          value={values.latitude}
          onChange={(e) => update('latitude', e.target.value)}
          disabled={submitting}
          placeholder="25.276987"
          required
        />
        <Input
          label="Longitude"
          type="number"
          step="any"
          value={values.longitude}
          onChange={(e) => update('longitude', e.target.value)}
          disabled={submitting}
          placeholder="55.296249"
          required
        />
      </div>

      {isGeolocationSupported() && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void handleUseMyLocation()}
          loading={locating}
          disabled={submitting}
        >
          Use my current location
        </Button>
      )}

      <Input
        label="Radius (meters)"
        type="number"
        min={1}
        value={values.radius_meters}
        onChange={(e) => update('radius_meters', e.target.value)}
        disabled={submitting}
        hint="Employees must be within this distance to clock in."
        required
      />

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
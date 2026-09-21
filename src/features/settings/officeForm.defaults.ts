/**
 * Form-local shape for the office-location modal.
 * Numeric fields are strings so inputs can be empty mid-edit;
 * parsing + validation happens on submit.
 */

export interface OfficeFormValues {
  name: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
}

export interface ParsedOfficeForm {
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export const OFFICE_FORM_DEFAULTS: OfficeFormValues = {
  name: '',
  latitude: '',
  longitude: '',
  radius_meters: '100',
};

export function parseOfficeForm(
  values: OfficeFormValues,
): { ok: true; value: ParsedOfficeForm } | { ok: false; error: string } {
  const name = values.name.trim();
  if (name.length < 2) return { ok: false, error: 'Name is required.' };

  const latitude = Number(values.latitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: 'Latitude must be between -90 and 90.' };
  }

  const longitude = Number(values.longitude);
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: 'Longitude must be between -180 and 180.' };
  }

  const radius_meters = Number(values.radius_meters);
  if (!Number.isFinite(radius_meters) || radius_meters <= 0) {
    return { ok: false, error: 'Radius must be a positive number of meters.' };
  }

  return { ok: true, value: { name, latitude, longitude, radius_meters } };
}
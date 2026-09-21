export {
  activateOfficeLocation,
  createOfficeLocation,
  deactivateOfficeLocation,
  deleteOfficeLocation,
  updateOfficeLocation,
} from '@/features/settings/api';
export type { OfficeLocationInput } from '@/features/settings/api';

export { useOfficeLocations } from '@/features/settings/useOfficeLocations';
export type { UseOfficeLocationsResult } from '@/features/settings/useOfficeLocations';

export { OfficeLocationsList } from '@/features/settings/OfficeLocationsList';
export { OfficeLocationForm } from '@/features/settings/OfficeLocationForm';
export { OfficeLocationModal } from '@/features/settings/OfficeLocationModal';

export {
  OFFICE_FORM_DEFAULTS,
  parseOfficeForm,
} from '@/features/settings/officeForm.defaults';
export type {
  OfficeFormValues,
  ParsedOfficeForm,
} from '@/features/settings/officeForm.defaults';
export {
  fetchActiveOfficeLocation,
  listOfficeLocations,
  recordLocationVerification,
} from '@/features/location/api';
export type { RecordVerificationInput } from '@/features/location/api';

export {
  getBrowserLocation,
  isGeolocationSupported,
} from '@/features/location/geolocation';
export type {
  GeolocationFailure,
  GeolocationOutcome,
  GeolocationSuccess,
} from '@/features/location/geolocation';

export { useOfficeLocation } from '@/features/location/useOfficeLocation';
export type { UseOfficeLocationResult } from '@/features/location/useOfficeLocation';

export { usePeriodicVerification } from '@/features/location/usePeriodicVerification';
export type { UsePeriodicVerificationArgs } from '@/features/location/usePeriodicVerification';
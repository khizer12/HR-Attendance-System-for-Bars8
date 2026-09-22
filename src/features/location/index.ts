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
export {
  fetchVerificationsForAttendance,
  fetchRecentVerificationsForEmployee,
} from '@/features/location/api';
export type { EmployeeVerificationRow } from '@/features/location/api';

export { useVerificationsForAttendance } from '@/features/location/useVerificationsForAttendance';
export type { UseVerificationsForAttendanceResult } from '@/features/location/useVerificationsForAttendance';

export { useRecentVerifications } from '@/features/location/useRecentVerifications';
export type { UseRecentVerificationsResult } from '@/features/location/useRecentVerifications';

export { VerificationList } from '@/features/location/VerificationList';
export type { VerificationRowView } from '@/features/location/VerificationList';

export { VerificationCard } from '@/features/location/VerificationCard';
export { EmployeeVerificationLog } from '@/features/location/EmployeeVerificationLog';

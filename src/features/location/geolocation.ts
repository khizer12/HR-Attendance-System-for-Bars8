/**
 * Promise wrapper around `navigator.geolocation.getCurrentPosition`.
 *
 * W3C PositionError codes are mapped onto our `verification_status` enum:
 *   1 PERMISSION_DENIED    → 'permission_denied'
 *   2 POSITION_UNAVAILABLE → 'unavailable'
 *   3 TIMEOUT              → 'unavailable'
 *   API missing / unknown  → 'unavailable'
 *
 * This function NEVER throws and NEVER invents coordinates. Callers decide
 * whether a failure should be persisted, and persist it verbatim.
 */

export interface GeolocationSuccess {
  ok: true;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
}

export interface GeolocationFailure {
  ok: false;
  status: 'permission_denied' | 'unavailable';
  message: string;
}

export type GeolocationOutcome = GeolocationSuccess | GeolocationFailure;

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export async function getBrowserLocation(
  options: PositionOptions = DEFAULT_OPTIONS,
): Promise<GeolocationOutcome> {
  if (!isGeolocationSupported()) {
    return {
      ok: false,
      status: 'unavailable',
      message: 'Geolocation is not supported by this browser.',
    };
  }

  return new Promise<GeolocationOutcome>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_meters: pos.coords.accuracy,
        });
      },
      (err) => {
        resolve({
          ok: false,
          status: mapErrorCode(err.code),
          message: err.message || 'Location request failed.',
        });
      },
      options,
    );
  });
}

function mapErrorCode(code: number): 'permission_denied' | 'unavailable' {
  switch (code) {
    case 1: // PERMISSION_DENIED
      return 'permission_denied';
    case 2: // POSITION_UNAVAILABLE
    case 3: // TIMEOUT
    default:
      return 'unavailable';
  }
}
/**
 * Open-Meteo client for Dubai.
 *
 * No API key, no signup. Free tier: 10,000 req/day; we use ~96.
 * Attribution required (CC BY 4.0) — shown in the Race page footer.
 */

const DUBAI_LAT = 25.276987;
const DUBAI_LNG = 55.296249;

const CACHE_KEY = 'hr-attendance:weather:dubai';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'storm'
  | 'unknown';

export interface WeatherSnapshot {
  condition: WeatherCondition;
  /** Degrees Celsius. */
  temperature: number;
  /** km/h. */
  windspeed: number;
  /** WMO weather code from Open-Meteo. */
  code: number;
  is_day: boolean;
  /** Unix ms when this snapshot was fetched. */
  fetched_at: number;
}

interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
    time: string;
  };
}

function conditionFromCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code >= 95 && code <= 99) return 'storm';
  return 'unknown';
}

function readCache(): WeatherSnapshot | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    if (Date.now() - parsed.fetched_at > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(snap: WeatherSnapshot): void {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
  } catch {
    // Quota exceeded or storage disabled — non-fatal.
  }
}

/**
 * Fetch Dubai weather, using a 15-minute local cache when possible.
 * Network failure returns the stale cache (if any) or 'unknown'.
 */
export async function fetchDubaiWeather(): Promise<WeatherSnapshot> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${DUBAI_LAT}` +
      `&longitude=${DUBAI_LNG}` +
      `&current_weather=true`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as OpenMeteoResponse;
    const cw = data.current_weather;

    const snap: WeatherSnapshot = {
      condition: conditionFromCode(cw.weathercode),
      temperature: cw.temperature,
      windspeed: cw.windspeed,
      code: cw.weathercode,
      is_day: cw.is_day === 1,
      fetched_at: Date.now(),
    };

    writeCache(snap);
    return snap;
  } catch {
    // Network failure — fall back to any older cached value, else unknown.
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw) as WeatherSnapshot;
    } catch {
      // ignore
    }

    return {
      condition: 'unknown',
      temperature: 0,
      windspeed: 0,
      code: -1,
      is_day: true,
      fetched_at: Date.now(),
    };
  }
}

export const WEATHER_LABEL: Record<WeatherCondition, string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  fog: 'Haze',
  rain: 'Rain',
  storm: 'Storm',
  unknown: 'Unavailable',
};
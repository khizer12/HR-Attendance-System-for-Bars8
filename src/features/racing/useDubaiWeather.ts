import { useEffect, useState } from 'react';

import {
  fetchDubaiWeather,
  type WeatherSnapshot,
} from '@/features/racing/weather';

export interface UseDubaiWeatherResult {
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch Dubai weather on mount. Refreshes every 15 minutes via
 * setInterval — the module-level cache guarantees we don't over-call
 * even if this hook is mounted on multiple tabs.
 */
export function useDubaiWeather(): UseDubaiWeatherResult {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchDubaiWeather();
        if (cancelled) return;
        setWeather(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load weather.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const id = window.setInterval(() => void load(), 15 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return { weather, loading, error };
}
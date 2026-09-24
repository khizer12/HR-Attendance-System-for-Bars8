import type { WeatherCondition } from '@/features/racing/weather';

interface WeatherOverlayProps {
  condition: WeatherCondition;
  isDay: boolean;
}

/**
 * Absolutely-positioned SVG layer rendered on top of the track.
 * Uses pointer-events-none so it never intercepts clicks.
 *
 * Kept deliberately subtle — the cars and track must stay clearly
 * visible through every weather state.
 */
export function WeatherOverlay({ condition, isDay }: WeatherOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Clear: warm sun glow in the top-right corner */}
      {condition === 'clear' && (
        <div
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(251,191,36,0) 70%)',
          }}
        />
      )}

      {/* Cloudy: soft dark veil */}
      {condition === 'cloudy' && (
        <div className="absolute inset-0 bg-black/20" />
      )}

      {/* Fog / haze: white veil */}
      {condition === 'fog' && (
        <div className="absolute inset-0 bg-white/10" />
      )}

      {/* Rain: dark veil + diagonal streaks */}
      {condition === 'rain' && (
        <>
          <div className="absolute inset-0 bg-blue-900/25" />
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="rain-streaks"
                width="4"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(15)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="4"
                  stroke="rgba(200,220,255,0.25)"
                  strokeWidth="0.6"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#rain-streaks)" />
          </svg>
        </>
      )}

      {/* Storm: darker + heavier streaks + red-tinted haze */}
      {condition === 'storm' && (
        <>
          <div className="absolute inset-0 bg-slate-900/45" />
          <div className="absolute inset-0 bg-danger/5" />
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="storm-streaks"
                width="3"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(20)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="3"
                  stroke="rgba(220,235,255,0.35)"
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#storm-streaks)" />
          </svg>
        </>
      )}

      {/* Night: darken everything, regardless of weather */}
      {!isDay && <div className="absolute inset-0 bg-black/40" />}
    </div>
  );
}
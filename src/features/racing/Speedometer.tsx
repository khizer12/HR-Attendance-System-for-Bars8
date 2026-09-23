interface SpeedometerProps {
  /** Current speed, 0 to max. Values outside are clamped. */
  kmh: number;
  /** Top of the dial. Default 200. */
  max?: number;
}

/**
 * Analog-style speedometer. Needle position is a pure function of the
 * `kmh` prop. Between prop changes, CSS interpolates over 1000ms linear,
 * which is what makes the needle appear to "sweep" rather than jump.
 *
 * Sweep: -120° (0 km/h) → +120° (max km/h).
 */
export function Speedometer({ kmh, max = 200 }: SpeedometerProps) {
  const clamped = Math.max(0, Math.min(max, kmh));
  const ratio = clamped / max;
  const needleAngle = -120 + ratio * 240;

  // Major ticks every 20 km/h.
  const majorTicks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];

  function tickAngle(v: number): number {
    return -120 + (v / max) * 240;
  }

  // Position on the dial at a given angle, for tick marks and labels.
  const CX = 100;
  const CY = 110;
  const R_OUTER = 78;
  const R_INNER = 68;
  const R_LABEL = 56;

  function posAt(angleDeg: number, r: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: CX + Math.sin(rad) * r,
      y: CY - Math.cos(rad) * r,
    };
  }

  return (
    <div className="rounded-lg border border-charcoal-3 bg-charcoal-2/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-gray mb-1">
        Speedometer
      </div>
      <svg viewBox="0 0 200 130" className="w-full" role="img" aria-label={`Speed ${Math.round(clamped)} kilometers per hour`}>
        {/* Background arc */}
        <path
          d={(() => {
            const a = posAt(-120, R_OUTER);
            const b = posAt(120, R_OUTER);
            return `M ${a.x} ${a.y} A ${R_OUTER} ${R_OUTER} 0 1 1 ${b.x} ${b.y}`;
          })()}
          fill="none"
          stroke="#2e2e34"
          strokeWidth={6}
          strokeLinecap="round"
        />

        {/* Major ticks + labels */}
        {majorTicks.map((v) => {
          const a = tickAngle(v);
          const outer = posAt(a, R_OUTER);
          const inner = posAt(a, R_INNER);
          const label = posAt(a, R_LABEL);
          return (
            <g key={v}>
              <line
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="#8b95a5"
                strokeWidth={1.5}
              />
              <text
                x={label.x}
                y={label.y}
                fill="#b08898"
                fontSize={8}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Needle — pivot at (100, 110). CSS rotates it around that point. */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: '100px 110px',
            transition: 'transform 1000ms linear',
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - 62}
            stroke="#dc2626"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>

        {/* Hub */}
        <circle cx={CX} cy={CY} r={5} fill="#0a0207" stroke="#dc2626" strokeWidth={1.5} />

        {/* Digital readout */}
        <text
          x={CX}
          y={CY - 20}
          fill="#f0e6d6"
          fontSize={16}
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ transition: 'opacity 300ms' }}
        >
          {Math.round(clamped)}
        </text>
        <text
          x={CX}
          y={CY - 6}
          fill="#8b95a5"
          fontSize={7}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          KM/H
        </text>
      </svg>
    </div>
  );
}
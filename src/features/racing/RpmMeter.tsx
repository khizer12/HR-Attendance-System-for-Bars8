interface RpmMeterProps {
  /** Completed hours so far — floor(elapsed_minutes / 60). */
  hours: number;
  /** Number of bars. Default 12. */
  bars?: number;
}

/**
 * Row of bars that fill one per completed hour. Colour climbs from
 * cool (early) to warm (redline) as the day progresses.
 *
 * Not a real tachometer — it's a "laps completed" indicator that reuses
 * the racing metaphor.
 */
export function RpmMeter({ hours, bars = 12 }: RpmMeterProps) {
  const active = Math.max(0, Math.min(bars, hours));

  function barColor(index: number): string {
    if (index >= 11) return 'bg-danger';
    if (index >= 8) return 'bg-warning';
    return 'bg-info';
  }

  return (
    <div className="rounded-lg border border-charcoal-3 bg-charcoal-2/40 p-3">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-gray">
          RPM · Laps
        </span>
        <span className="text-xs tabular-nums text-off-white">
          {active}
          <span className="text-muted-gray">/{bars}</span>
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: bars }).map((_, i) => {
          const isActive = i < active;
          return (
            <div
              key={i}
              className={[
                'h-3 flex-1 rounded-sm transition-all duration-300 ease-out',
                isActive ? barColor(i) : 'bg-charcoal-3',
                isActive ? 'shadow-[0_0_6px_currentColor]' : '',
              ].join(' ')}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}
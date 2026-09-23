import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/utils/cn';
import { useRacingData } from '@/features/racing/useRacingData';
import type { RacingCar } from '@/types/racing';

interface CarPickerModalProps {
  currentCarId: string | null;
  currentTrackId: string | null;
  description?: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (args: { carId: string; trackId: string }) => void;
}

const CATEGORY_LABEL: Record<RacingCar['category'], string> = {
  f1: 'Formula',
  gt: 'GT',
  hypercar: 'Hypercar',
  rally: 'Rally',
  dirt: 'Dirt',
  truck: 'Truck',
  stock: 'Stock',
  drift: 'Drift',
  prototype: 'Prototype',
  suv: 'SUV',
};

/**
 * Car + track picker. Deliberately has NO `open` prop — the parent
 * conditionally renders this component, so it mounts fresh every time
 * it's shown. That gives us clean initial state without needing an
 * effect to sync props → state on open.
 */
export function CarPickerModal({
  currentCarId,
  currentTrackId,
  description,
  submitting,
  error,
  onClose,
  onSave,
}: CarPickerModalProps) {
  const { cars, tracks, loading, error: loadError } = useRacingData();

  const [carId, setCarId] = useState<string | null>(currentCarId);
  const [trackId, setTrackId] = useState<string | null>(currentTrackId);

  // If the user never touched the track selector, default to the first
  // available circuit. Derived during render, not synced via effect.
  const effectiveTrackId = trackId ?? tracks[0]?.id ?? null;

  const canSave = carId !== null && effectiveTrackId !== null && !submitting;

  function handleSubmit() {
    if (!carId || !effectiveTrackId) return;
    onSave({ carId, trackId: effectiveTrackId });
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Choose your ride"
      description={
        description ?? 'Pick a car and a circuit. You can change both anytime.'
      }
      className="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Cars */}
        <section>
          <h3 className="font-heading text-sm font-semibold text-off-white mb-2">
            Car
          </h3>
          {loading ? (
            <p className="text-xs text-muted-gray">Loading cars…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cars.map((c) => {
                const isSelected = carId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCarId(c.id)}
                    disabled={submitting}
                    className={cn(
                      'flex items-center gap-3 rounded-md p-3 text-left transition-colors',
                      'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime',
                      isSelected
                        ? 'border-lime bg-charcoal-2'
                        : 'border-charcoal-3 bg-charcoal-2/60 hover:bg-charcoal-2',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="h-8 w-8 shrink-0 rounded-md border border-charcoal-3"
                      style={{ backgroundColor: c.accent_color }}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-off-white truncate">
                        {c.name}
                      </span>
                      <span className="block text-[10px] text-muted-gray uppercase tracking-wider">
                        {CATEGORY_LABEL[c.category]} · {c.top_speed_kph} kph
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Tracks */}
        <section>
          <h3 className="font-heading text-sm font-semibold text-off-white mb-2">
            Circuit
          </h3>
          {loading ? (
            <p className="text-xs text-muted-gray">Loading circuits…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {tracks.map((t) => {
                const isSelected = effectiveTrackId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTrackId(t.id)}
                    disabled={submitting}
                    className={cn(
                      'rounded-md p-3 text-left transition-colors',
                      'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime',
                      isSelected
                        ? 'border-lime bg-charcoal-2'
                        : 'border-charcoal-3 bg-charcoal-2/60 hover:bg-charcoal-2',
                    )}
                  >
                    <span className="block text-xs font-medium text-off-white">
                      {t.name}
                    </span>
                    <span className="block text-[10px] text-muted-gray uppercase tracking-wider mt-0.5">
                      {t.country} · {t.total_laps} laps
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {(error || loadError) && (
          <div
            role="alert"
            className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
          >
            {error ?? loadError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSave}
          >
            Confirm selection
          </Button>
        </div>
      </div>
    </Modal>
  );
}
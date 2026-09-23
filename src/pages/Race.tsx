import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/features/auth';
import {
  CarPickerModal,
  RpmMeter,
  Speedometer,
  TrackCanvas,
  useRaceParticipants,
  useRacingData,
  useRacingProfile,
} from '@/features/racing';
import { secondsBetween } from '@/lib/time';
import { useNow } from '@/hooks/useNow';

export default function Race() {
  const { profile: user } = useAuth();
  const { profile: racing, save: saveRacing } = useRacingProfile();
  const { tracks, loading: dataLoading } = useRacingData();
  const { participants, loading: racersLoading } = useRaceParticipants();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSaving, setPickerSaving] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [cameraFollow, setCameraFollow] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(2);

  // One tick per second drives the needle smoothly.
  const now = useNow(1000, true);

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === racing?.track_id) ?? tracks[0] ?? null,
    [tracks, racing?.track_id],
  );

  // Live minutes-worked per participant (finished + live).
  const liveMinutes = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of participants) {
      let mins = p.work_minutes;
      if (p.on_track && p.clock_in_at) {
        const liveSeconds = secondsBetween(p.clock_in_at, now);
        mins = Math.floor(liveSeconds / 60);
      }
      map.set(p.user_id, mins);
    }
    return map;
  }, [participants, now]);

  // ---- Self-only metrics for the speedometer / RPM ----
  const self = participants.find((p) => p.user_id === user?.id) ?? null;

  const selfElapsedSeconds =
    self?.on_track && self.clock_in_at
      ? secondsBetween(self.clock_in_at, now)
      : 0;

  const secondsInCurrentLap = selfElapsedSeconds % 3600;
  const currentKmh = (secondsInCurrentLap / 3600) * 200;
  const completedHours = Math.floor(selfElapsedSeconds / 3600);

  async function handlePickerSave(args: { carId: string; trackId: string }) {
    setPickerSaving(true);
    setPickerError(null);
    try {
      await saveRacing({ car_id: args.carId, track_id: args.trackId });
      setPickerOpen(false);
    } catch (e) {
      setPickerError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setPickerSaving(false);
    }
  }

  const loading = dataLoading || racersLoading;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl">Race</h2>
          <p className="text-muted-gray text-sm mt-1">
            {currentTrack
              ? `${currentTrack.name} · ${currentTrack.country}`
              : 'Loading circuit…'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={cameraFollow ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCameraFollow((v) => !v)}
          >
            {cameraFollow ? 'Camera: Follow' : 'Camera: Free'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoomLevel((z) => (z >= 3 ? 1 : z + 1))}
          >
            Zoom {zoomLevel}×
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPickerOpen(true)}
          >
            Change car
          </Button>
        </div>
      </div>

      {/* Instrument cluster — only shown when the user is checked in. */}
      {self?.on_track && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Speedometer kmh={currentKmh} max={200} />
          <RpmMeter hours={completedHours} bars={12} />
        </div>
      )}

      {loading || !currentTrack ? (
        <Card>
          <CardBody className="py-16 text-center">
            <p className="text-sm text-muted-gray">Loading circuit…</p>
          </CardBody>
        </Card>
      ) : (
        <TrackCanvas
          track={currentTrack}
          participants={participants}
          liveMinutes={liveMinutes}
          selfId={user?.id ?? null}
          cameraFollow={cameraFollow}
          zoomLevel={zoomLevel}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>On track now</CardTitle>
          <p className="text-xs text-muted-gray mt-1">
            {participants.filter((p) => p.on_track).length} of{' '}
            {participants.length} racers active
          </p>
        </CardHeader>
        <CardBody className="p-0">
          {participants.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-gray">
                Nobody has started a race today.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-charcoal-3">
              {participants
                .slice()
                .sort(
                  (a, b) =>
                    (liveMinutes.get(b.user_id) ?? 0) -
                    (liveMinutes.get(a.user_id) ?? 0),
                )
                .map((p) => {
                  const mins = liveMinutes.get(p.user_id) ?? 0;
                  const laps = Math.floor(mins / 60);
                  const lapMin = mins % 60;
                  return (
                    <li
                      key={p.user_id}
                      className="px-5 py-3 flex items-center gap-3"
                    >
                      <span
                        aria-hidden="true"
                        className="h-6 w-6 rounded-md border border-charcoal-3"
                        style={{
                          backgroundColor: p.car?.accent_color ?? '#666',
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-off-white truncate">
                          {p.display_name}
                          {p.user_id === user?.id && (
                            <span className="text-muted-gray"> (you)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-gray">
                          {p.car?.name ?? 'No car'} · lap {laps + 1} +{' '}
                          {lapMin}m
                          {p.on_pit && ' · in pit'}
                        </p>
                      </div>
                      <span className="text-xs tabular-nums text-muted-gray">
                        {mins}m
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </CardBody>
      </Card>

      {pickerOpen && (
        <CarPickerModal
          currentCarId={racing?.car_id ?? null}
          currentTrackId={racing?.track_id ?? null}
          submitting={pickerSaving}
          error={pickerError}
          onClose={() => setPickerOpen(false)}
          onSave={handlePickerSave}
        />
      )}
    </div>
  );
}
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRacingData } from '@/features/racing';
import { useRacingProfile } from '@/features/racing';

export default function Race() {
  const { profile, loading: profileLoading } = useRacingProfile();
  const { cars, tracks, loading: dataLoading } = useRacingData();

  const car = cars.find((c) => c.id === profile?.car_id) ?? null;
  const track = tracks.find((t) => t.id === profile?.track_id) ?? null;
  const loading = profileLoading || dataLoading;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h2 className="font-heading text-2xl">Race</h2>
        <p className="text-muted-gray text-sm mt-1">
          Your circuit and car. Full visualization arrives in R3.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your setup</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {loading ? (
            <p className="text-xs text-muted-gray">Loading…</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-gray">Car</span>
                <span className="text-sm font-medium text-off-white">
                  {car ? car.name : 'Not selected'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-gray">Circuit</span>
                <span className="text-sm font-medium text-off-white">
                  {track ? `${track.name} (${track.country})` : 'Not selected'}
                </span>
              </div>
              {car && (
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-gray">Top speed</span>
                  <span className="text-sm font-medium text-off-white">
                    {car.top_speed_kph} kph
                  </span>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
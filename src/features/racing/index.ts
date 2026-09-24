export {
  getMyRacingProfile,
  listRacingCars,
  listRacingTracks,
  upsertMyRacingProfile,
} from '@/features/racing/api';
export type { UpsertRacingProfileInput } from '@/features/racing/api';

export { useRacingData } from '@/features/racing/useRacingData';
export type { UseRacingDataResult } from '@/features/racing/useRacingData';

export { useRacingProfile } from '@/features/racing/useRacingProfile';
export type { UseRacingProfileResult } from '@/features/racing/useRacingProfile';

export { CarPickerModal } from '@/features/racing/CarPickerModal';
export { samplePath, pointAt, angleAt } from '@/features/racing/geometry';
export type { SampledPath, SampledPoint } from '@/features/racing/geometry';

export { useRaceParticipants } from '@/features/racing/useRaceParticipants';
export type { UseRaceParticipantsResult } from '@/features/racing/useRaceParticipants';

export { TrackCanvas } from '@/features/racing/TrackCanvas';
export { Speedometer } from '@/features/racing/Speedometer';
export { RpmMeter } from '@/features/racing/RpmMeter';
export { useDubaiWeather } from '@/features/racing/useDubaiWeather';
export type { UseDubaiWeatherResult } from '@/features/racing/useDubaiWeather';

export { WeatherOverlay } from '@/features/racing/WeatherOverlay';
export type { WeatherSnapshot, WeatherCondition } from '@/features/racing/weather';
export { WEATHER_LABEL } from '@/features/racing/weather';
export {
  fetchLeaderboard,
  fetchWeeklySnapshot,
} from '@/features/racing/leaderboardApi';
export type {
  LeaderboardRange,
  LeaderboardRow,
  WeeklySnapshot,
} from '@/features/racing/leaderboardApi';

export { useLeaderboard } from '@/features/racing/useLeaderboard';
export type { UseLeaderboardResult } from '@/features/racing/useLeaderboard';

export { LeaderboardTabs } from '@/features/racing/LeaderboardTabs';
export { LeaderboardTable } from '@/features/racing/LeaderboardTable';
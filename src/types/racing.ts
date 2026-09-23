/** Racing domain types. Mirrors the R1 migration. */

export type CarCategory =
  | 'f1'
  | 'gt'
  | 'hypercar'
  | 'rally'
  | 'dirt'
  | 'truck'
  | 'stock'
  | 'drift'
  | 'prototype'
  | 'suv';

export interface RacingCar {
  id: string;
  name: string;
  category: CarCategory;
  accent_color: string;
  top_speed_kph: number;
  sort_order: number;
  active: boolean;
}

export interface RacingTrack {
  id: string;
  name: string;
  country: string;
  path_data: string;
  total_laps: number;
  sort_order: number;
  active: boolean;
}

export interface UserRacingProfile {
  user_id: string;
  car_id: string | null;
  track_id: string | null;
  avatar_key: string | null;
  updated_at: string;
}
/**
 * One racer on the track — either currently driving or already parked.
 * Derived from attendance + racing profile, not stored.
 */
export interface RaceParticipant {
  user_id: string;
  display_name: string;
  email: string;
  car: RacingCar | null;
  avatar_key: string | null;
  /** Minutes worked so far today (breaks subtracted). */
  work_minutes: number;
  /** True when currently checked in and not parked. */
  on_track: boolean;
  /** True when the employee is on a pit stop right now. */
  on_pit: boolean;
  /** ISO timestamp of clock-in. Null if never clocked in today. */
  clock_in_at: string | null;
}
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
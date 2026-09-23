import { supabase } from '@/lib/supabase';
import type {
  RacingCar,
  RacingTrack,
  UserRacingProfile,
} from '@/types/racing';

/**
 * Racing reads/writes. RLS handles authorization — no business logic here.
 */

const CAR_COLUMNS =
  'id, name, category, accent_color, top_speed_kph, sort_order, active';

const TRACK_COLUMNS =
  'id, name, country, path_data, total_laps, sort_order, active';

const PROFILE_COLUMNS = 'user_id, car_id, track_id, avatar_key, updated_at';

export async function listRacingCars(): Promise<RacingCar[]> {
  const { data, error } = await supabase
    .from('racing_cars')
    .select(CAR_COLUMNS)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as RacingCar[];
}

export async function listRacingTracks(): Promise<RacingTrack[]> {
  const { data, error } = await supabase
    .from('racing_tracks')
    .select(TRACK_COLUMNS)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as RacingTrack[];
}

export async function getMyRacingProfile(): Promise<UserRacingProfile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase
    .from('user_racing_profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', uid)
    .maybeSingle<UserRacingProfile>();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export interface UpsertRacingProfileInput {
  car_id?: string | null;
  track_id?: string | null;
  avatar_key?: string | null;
}

/**
 * Upsert the current user's racing profile. RLS enforces user_id = auth.uid().
 * If no profile exists, one is created. Otherwise, the provided fields are
 * merged in.
 */
export async function upsertMyRacingProfile(
  input: UpsertRacingProfileInput,
): Promise<UserRacingProfile> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  // Fetch existing profile so we don't null out fields that weren't provided.
  const existing = await getMyRacingProfile();

  const payload = {
    user_id: uid,
    car_id: input.car_id !== undefined ? input.car_id : existing?.car_id ?? null,
    track_id:
      input.track_id !== undefined ? input.track_id : existing?.track_id ?? null,
    avatar_key:
      input.avatar_key !== undefined
        ? input.avatar_key
        : existing?.avatar_key ?? null,
  };

  const { data, error } = await supabase
    .from('user_racing_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select(PROFILE_COLUMNS)
    .single<UserRacingProfile>();

  if (error) throw new Error(error.message);
  return data;
}
/**
 * Application-level role. Mirrors the `user_role` enum in Postgres.
 * If the DB enum changes, this type must change with it.
 */
export type Role = 'super_admin' | 'sub_admin' | 'employee';

/**
 * Row shape of `public.profiles`.
 * Column list matches the migration `init_profiles`.
 */
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  active: boolean;
  created_at: string;
  updated_at: string;
}
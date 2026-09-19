import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';

import type { Profile } from '@/types/auth';

export interface AuthContextValue {
  /** Raw Supabase auth session. Null when signed out. */
  session: Session | null;

  /** Profile row from `public.profiles`. Null while loading or when signed out. */
  profile: Profile | null;

  /** True while the initial session is being resolved. */
  loading: boolean;

  /** Human-readable error from the last profile fetch, if any. */
  error: string | null;

  /** Convenience booleans. */
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isSubAdmin: boolean;
  isEmployee: boolean;

  /** Sign in with email + password. Resolves with `{ error }`. */
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;

  /** Sign out. The subscription handles clearing state. */
  signOut: () => Promise<void>;

  /** Re-fetch the current user's profile row. */
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { AuthContext, type AuthContextValue } from '@/features/auth/auth.context';
import type { Profile } from '@/types/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>();

    if (fetchError) {
      setProfile(null);
      setError(fetchError.message);
      return;
    }
    setProfile(data);
  }, []);

    const userId = session?.user.id;

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    await fetchProfile(userId);
  }, [userId, fetchProfile]);   

  // Initial session + subscription
  useEffect(() => {
    let mounted = true;

    // 1. Resolve current session once
    void supabase.auth.getSession().then(async ({ data: { session: initial } }) => {
      if (!mounted) return;
      setSession(initial);

      if (initial?.user.id) {
        await fetchProfile(initial.user.id);
      }
      if (mounted) setLoading(false);
    });

    // 2. React to future auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);

      if (nextSession?.user.id) {
        void fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: signInError ? signInError.message : null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = profile?.role ?? null;
    return {
      session,
      profile,
      loading,
      error,
      isAuthenticated: !!session,
      isSuperAdmin: role === 'super_admin',
      isSubAdmin: role === 'sub_admin',
      isEmployee: role === 'employee',
      signIn,
      signOut,
      refreshProfile,
    };
  }, [session, profile, loading, error, signIn, signOut, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
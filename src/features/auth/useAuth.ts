import { useContext } from 'react';

import { AuthContext } from '@/features/auth/auth.context';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth must be used inside <AuthProvider>. ' +
        'Wrap your app in <AuthProvider> in src/App.tsx.',
    );
  }
  return ctx;
}
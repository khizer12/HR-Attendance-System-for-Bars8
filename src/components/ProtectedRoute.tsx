import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional: restrict to specific roles. Omit to allow any signed-in user. */
  allowRoles?: Array<'super_admin' | 'sub_admin' | 'employee'>;
}

export function ProtectedRoute({ children, allowRoles }: ProtectedRouteProps) {
  const { loading, isAuthenticated, profile } = useAuth();
  const location = useLocation();

  // While the initial session/profile is loading, keep the shell mounted
  // so we don't flash the login page on refresh.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-near-black">
        <div className="flex flex-col items-center gap-3">
          <div
            aria-hidden="true"
            className="h-6 w-6 animate-spin rounded-full border-2 border-lime border-t-transparent"
          />
          <p className="text-xs text-muted-gray">Loading…</p>
        </div>
      </div>
    );
  }

  // Not signed in — remember where they were trying to go.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Signed in but profile hasn't loaded (edge case: profile row missing).
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-near-black p-6">
        <div className="max-w-sm rounded-lg border border-danger/30 bg-danger/10 p-5 text-center">
          <p className="text-sm font-medium text-off-white">
            No profile found for your account
          </p>
          <p className="text-xs text-muted-gray mt-2">
            Contact your administrator to have your profile created.
          </p>
        </div>
      </div>
    );
  }

  // Signed in but inactive — deny access.
  if (!profile.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-near-black p-6">
        <div className="max-w-sm rounded-lg border border-warning/30 bg-warning/10 p-5 text-center">
          <p className="text-sm font-medium text-off-white">
            Your account is inactive
          </p>
          <p className="text-xs text-muted-gray mt-2">
            Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Role gate, if requested.
  if (allowRoles && !allowRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
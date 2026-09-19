import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth';

interface LocationState {
  from?: string;
}

export default function Login() {
  const { signIn, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the user is already signed in, bounce them to their destination.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Redirect is handled by the <Navigate> below — this effect is a safety net.
    }
  }, [loading, isAuthenticated]);

  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email.');
      setSubmitting(false);
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      setSubmitting(false);
      return;
    }

    const { error: signInError } = await signIn(trimmedEmail, password);
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
      return;
    }
    // Success — the auth listener will trigger the <Navigate> above on next render.
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-near-black p-6 bg-grid">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-lg bg-lime flex items-center justify-center">
            <span className="font-heading font-bold text-near-black text-lg">
              HR
            </span>
          </div>
          <div className="text-center">
            <h1 className="font-heading text-xl font-semibold">
              Attendance Management
            </h1>
            <p className="text-muted-gray text-xs mt-1">
              Sign in to continue
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-lg bg-charcoal border border-charcoal-3 p-6 space-y-4"
        >
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          {error && (
            <div
              role="alert"
              className="rounded-md bg-danger/10 border border-danger/30 px-3 py-2 text-xs text-danger"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-gray mt-6">
          Access is provisioned by your administrator.
        </p>
      </div>
    </div>
  );
}
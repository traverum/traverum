import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.traverum.com';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type InviteState = 'loading' | 'invalid' | 'signup' | 'join' | 'submitting';

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [state, setState] = useState<InviteState>('loading');
  const [partnerName, setPartnerName] = useState('');
  const [role, setRole] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    async function fetchInvite() {
      try {
        const res = await fetch(`${WIDGET_BASE_URL}/api/invitations/${token}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMessage(data.error || 'This invite link is no longer valid');
          setState('invalid');
          return;
        }

        const data = await res.json();
        setPartnerName(data.partner_name);
        setRole(data.role);
      } catch {
        setErrorMessage('Unable to verify invitation');
        setState('invalid');
      }
    }

    fetchInvite();
  }, [token]);

  useEffect(() => {
    if (authLoading || !partnerName) return;
    setState(user ? 'join' : 'signup');
  }, [user, authLoading, partnerName]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setState('submitting');
    try {
      const res = await fetch(`${WIDGET_BASE_URL}/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'EMAIL_EXISTS') {
          setErrors({ email: data.error });
          setState('signup');
          return;
        }
        toast.error(data.error || 'Failed to create account');
        setState('signup');
        return;
      }

      // Sign in with the newly created credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.error('Account created but login failed. Please sign in manually.');
        navigate('/auth', { replace: true });
        return;
      }

      toast.success(`Welcome to ${partnerName}`);
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Something went wrong');
      setState('signup');
    }
  };

  const handleJoin = async () => {
    setState('submitting');
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${WIDGET_BASE_URL}/api/invitations/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to join organization');
        setState('join');
        return;
      }

      toast.success(`You've joined ${partnerName}`);
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Something went wrong');
      setState('join');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card className="border border-border">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-foreground mb-4">{errorMessage}</p>
              <Link
                to="/auth"
                className="text-sm text-primary hover:underline font-medium"
              >
                Go to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Join {partnerName}
          </h1>
          <p className="text-secondary">
            {state === 'join'
              ? `You'll be added as ${role}`
              : 'Create your account to get started'}
          </p>
        </div>

        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">
              {state === 'join' ? 'Join Organization' : 'Create Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(state === 'signup' || state === 'submitting') && !user && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={state === 'submitting'}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={state === 'submitting'}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={state === 'submitting'}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" disabled={state === 'submitting'} className="w-full h-7">
                  {state === 'submitting' ? 'Creating account...' : 'Create Account'}
                </Button>

                <p className="text-center text-sm text-secondary">
                  Already have an account?{' '}
                  <Link
                    to={`/auth?mode=login&next=/invite/${token}`}
                    className="text-primary hover:underline font-medium"
                  >
                    Log in
                  </Link>
                </p>
              </form>
            )}

            {(state === 'join' || (state === 'submitting' && user)) && (
              <div className="space-y-4">
                <p className="text-sm text-secondary">
                  Signed in as <span className="text-foreground font-medium">{user?.email}</span>
                </p>
                <Button
                  onClick={handleJoin}
                  disabled={state === 'submitting'}
                  className="w-full h-7"
                >
                  {state === 'submitting' ? 'Joining...' : 'Join Organization'}
                </Button>
                <p className="text-center text-sm text-secondary">
                  Not you?{' '}
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setState('signup');
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Use a different account
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

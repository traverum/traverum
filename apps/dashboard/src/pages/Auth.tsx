import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { z } from 'zod';

const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_URL || 'https://book.veyond.eu';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

type AuthMode = 'login' | 'signup' | 'reset-password';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const mode: AuthMode = useMemo(() => {
    const m = searchParams.get('mode');
    if (m === 'signup' || m === 'reset-password') return m;
    return 'login';
  }, [searchParams]);

  const linkExpired = searchParams.get('error') === 'link_expired';

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  useEffect(() => {
    // For reset-password mode, we need the user session (from the reset link token)
    // so don't redirect them away
    if (mode === 'reset-password') return;

    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, mode]);

  const setMode = (newMode: AuthMode) => {
    setErrors({});
    setPassword('');
    setConfirmPassword('');
    setSearchParams({ mode: newMode }, { replace: true });
  };

  // --- Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      }
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Login failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Login failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Signup ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      signupSchema.parse({ email, password, confirmPassword });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      }
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (RECAPTCHA_SITE_KEY) {
        const token = await getRecaptchaToken(RECAPTCHA_SITE_KEY, 'signup');
        const verifyRes = await fetch(`${WIDGET_BASE_URL}/api/auth/verify-recaptcha`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok || !verifyData.success) {
          toast({
            title: 'Verification failed',
            description: verifyData.error ?? 'Please try again or refresh the page.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await signUp(email, password);
      if (error) {
        toast({
          title: 'Signup failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account created',
          description: 'Check your email to verify your account.',
        });
        navigate('/verify-email');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot password (send reset email) ---
  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      loginSchema.pick({ email: true }).parse({ email });
    } catch {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast({
        title: 'Could not send reset email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link. Please check your inbox.',
      });
    }
    setLoading(false);
  };

  // --- Set new password (after clicking reset link) ---
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      resetPasswordSchema.parse({ password, confirmPassword });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
      }
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({
          title: 'Could not update password',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password updated',
          description: 'Your password has been set successfully.',
        });
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---

  const headings: Record<AuthMode, { title: string; subtitle: string; cardTitle: string }> = {
    login: {
      title: 'Welcome',
      subtitle: 'Log in to your account',
      cardTitle: 'Log in',
    },
    signup: {
      title: 'Get Started',
      subtitle: 'Create your account',
      cardTitle: 'Create account',
    },
    'reset-password': {
      title: 'Reset Password',
      subtitle: 'Enter your new password',
      cardTitle: 'Set new password',
    },
  };

  const { title, subtitle, cardTitle } = headings[mode];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">{title}</h1>
          <p className="text-secondary">{subtitle}</p>
        </div>

        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold">{cardTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ===== LOGIN MODE ===== */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-secondary hover:text-foreground transition-ui"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full h-7">
                  {loading ? 'Loading...' : 'Log In'}
                </Button>

                <p className="text-center text-sm text-secondary">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Create account
                  </button>
                </p>
              </form>
            )}

            {/* ===== SIGNUP MODE ===== */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full h-7">
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>

                <p className="text-center text-sm text-secondary">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Log in
                  </button>
                </p>
              </form>
            )}

            {/* ===== RESET PASSWORD MODE ===== */}
            {mode === 'reset-password' && linkExpired && (
              <div className="space-y-4">
                <p className="text-sm text-secondary">
                  This link was used or opened in a different browser, or it has expired. Request a new reset link below.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="button"
                  disabled={loading}
                  className="w-full h-7"
                  onClick={() => {
                    if (!email) {
                      toast({ title: 'Enter your email', variant: 'destructive' });
                      return;
                    }
                    handleForgotPassword();
                  }}
                >
                  {loading ? 'Sending...' : 'Send new reset link'}
                </Button>
                <p className="text-center text-sm text-secondary">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Back to login
                  </button>
                </p>
              </div>
            )}
            {mode === 'reset-password' && !linkExpired && (
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full h-7">
                  {loading ? 'Updating...' : 'Set New Password'}
                </Button>

                <p className="text-center text-sm text-secondary">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Back to login
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

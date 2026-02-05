import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Mail, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms to continue',
  }),
});

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type AuthMode = 'login' | 'signup';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') || 'login') as AuthMode;
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'password' | 'email' | 'google' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  const { 
    signIn, 
    signUp, 
    signInWithMagicLink, 
    signInWithGoogle,
    resetPassword,
    user 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const validateForm = () => {
    try {
      if (loginMethod === 'email') {
        magicLinkSchema.parse({ email });
      } else if (mode === 'login') {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, termsAccepted });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
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
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please log in instead.',
              variant: 'destructive',
            });
            setMode('login');
          } else {
            toast({
              title: 'Could not create account',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Check your email',
            description: 'We sent you a confirmation link. Please check your inbox.',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});

    try {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        toast({
          title: 'Could not send magic link',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setMagicLinkSent(true);
        toast({
          title: 'Check your email',
          description: 'We sent you a login link. Please check your inbox.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Authentication failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    }
    // Note: OAuth redirect will handle navigation
  };

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
      magicLinkSchema.parse({ email });
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

  // Magic link sent confirmation
  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-secondary">
              We sent a login link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-secondary">
              Click the link in the email to sign in. The link will expire in 1 hour.
            </p>
            <Button
              variant="outline"
              className="w-full h-7"
              onClick={() => {
                setMagicLinkSent(false);
                setLoginMethod(null);
                setEmail('');
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main auth screen - show three options
  if (!loginMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">Welcome</h1>
            <p className="text-secondary">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          <Card className="border border-border shadow-lg">
            <CardContent className="pt-6 space-y-3">
              <Button
                onClick={() => setLoginMethod('password')}
                className="w-full h-7 justify-start"
                variant="outline"
              >
                <Lock className="h-4 w-4 mr-2" />
                Continue with password
              </Button>

              <Button
                onClick={() => setLoginMethod('email')}
                className="w-full h-7 justify-start"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Continue with email link
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleAuth}
                className="w-full h-7 justify-start"
                variant="outline"
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </CardContent>

            <div className="px-6 pb-6 pt-4 border-t border-border">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setLoginMethod(null);
                    setErrors({});
                  }}
                  className="text-sm text-secondary hover:text-foreground transition-ui"
                  disabled={loading}
                >
                  {mode === 'login'
                    ? "Don't have an account? Create one"
                    : 'Already have an account? Log in'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Password login/signup form
  if (loginMethod === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border border-border shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="pl-9"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-secondary hover:text-foreground transition-ui"
                        disabled={loading}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pl-9"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                        disabled={loading}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        I agree to Traverum's Terms of Service and Privacy Policy
                      </Label>
                    </div>
                    {errors.termsAccepted && (
                      <p className="text-sm text-destructive">{errors.termsAccepted}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLoginMethod(null);
                      setErrors({});
                      setPassword('');
                    }}
                    disabled={loading}
                    className="h-7 px-3 flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="h-7 px-3 flex-1">
                    {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Email link (magic link) form
  if (loginMethod === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border border-border shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-semibold">Sign in with email</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-link">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-link"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="pl-9"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <p className="text-xs text-secondary">
                  We'll send you a secure link to sign in. No password needed.
                </p>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setLoginMethod(null);
                      setErrors({});
                      setEmail('');
                    }}
                    disabled={loading}
                    className="h-7 px-3 flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="h-7 px-3 flex-1">
                    {loading ? 'Sending...' : 'Send login link'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}

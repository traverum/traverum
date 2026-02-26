import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/dashboard';
    const hash = window.location.hash || '';
    const isRecovery = hash.includes('type=recovery') || next.includes('reset-password');

    // PKCE flow: code in query → exchange then redirect
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Auth callback error:', error.message);
          navigate('/auth?mode=reset-password&error=link_expired', { replace: true });
        } else {
          navigate(isRecovery ? '/auth?mode=reset-password' : next, { replace: true });
        }
      });
      return;
    }

    // Implicit flow: tokens in hash (e.g. type=recovery from password reset email)
    // Supabase client parses the hash and sets the session on load
    if (hash.includes('type=recovery')) {
      const t = setTimeout(() => navigate('/auth?mode=reset-password', { replace: true }), 300);
      return () => clearTimeout(t);
    }

    if (hash.includes('access_token=')) {
      const t = setTimeout(() => navigate(next, { replace: true }), 300);
      return () => clearTimeout(t);
    }

    // No code and no hash: send to reset-password form if that was the intent so user can request a new link
    if (isRecovery) {
      navigate('/auth?mode=reset-password&error=link_expired', { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-secondary">Verifying...</p>
    </div>
  );
}

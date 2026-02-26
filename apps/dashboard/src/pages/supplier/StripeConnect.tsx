import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActivePartner } from '@/hooks/useActivePartner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Stripe Connect redirect handler.
 *
 * Stripe's Account Link flow requires a `refresh_url` for cases where the
 * onboarding link expires or is revisited. Per Stripe docs, this page should
 * generate a fresh Account Link and redirect the user back into the flow.
 *
 * If no refresh param is present, redirects to the supplier dashboard.
 */
export default function StripeConnect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activePartnerId, isLoading } = useActivePartner();
  const triggered = useRef(false);

  useEffect(() => {
    if (isLoading || triggered.current) return;
    if (!searchParams.has('refresh')) {
      navigate('/supplier/dashboard', { replace: true });
      return;
    }

    triggered.current = true;

    async function resumeOnboarding() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !activePartnerId) {
          toast.error('Please log in to continue');
          navigate('/auth?mode=login', { replace: true });
          return;
        }

        const response = await supabase.functions.invoke('create-connect-account', {
          body: { origin: window.location.origin, partner_id: activePartnerId },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to resume Stripe setup');
        }

        const { url } = response.data;
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No onboarding URL returned');
        }
      } catch (error: any) {
        console.error('Stripe Connect refresh error:', error);
        toast.error('Something went wrong. Please try again from the dashboard.');
        navigate('/supplier/dashboard', { replace: true });
      }
    }

    resumeOnboarding();
  }, [isLoading, activePartnerId, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Resuming Stripe setup...</p>
      </div>
    </div>
  );
}

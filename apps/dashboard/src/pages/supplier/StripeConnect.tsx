import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierData } from '@/hooks/useSupplierData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function StripeConnect() {
  const navigate = useNavigate();
  const { partner, hasStripe } = useSupplierData();
  const [loading, setLoading] = useState(false);

  const handleConnectStripe = async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to connect Stripe');
        navigate('/auth?mode=login');
        return;
      }

      const response = await supabase.functions.invoke('create-connect-account', {
        body: { origin: window.location.origin },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create Stripe account');
      }

      const { url } = response.data;
      
      if (url) {
        // Redirect to Stripe onboarding
        window.location.href = url;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (error: any) {
      console.error('Stripe Connect error:', error);
      toast.error(error.message || 'Failed to connect Stripe');
      setLoading(false);
    }
  };

  if (hasStripe) {
    return (
      <div className="min-h-screen bg-background-alt">
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/supplier/dashboard')}
            >
              Back
            </Button>
            <h1 className="text-lg font-semibold">Payment Settings</h1>
            <div className="w-16" />
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Stripe Connected</h3>
              <p className="text-muted-foreground mb-4">
                Your Stripe account is connected and ready to receive payments.
              </p>
              <p className="text-sm text-muted-foreground">
                Account ID: {partner?.stripe_account_id || 'Connected'}
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-alt">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/supplier/dashboard')}
          >
            Back
          </Button>
          <h1 className="text-lg font-semibold">Connect Stripe</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="border-0 shadow-sm mb-6">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4" />
            <CardTitle className="text-2xl">Set Up Payments</CardTitle>
            <CardDescription className="text-base">
              Connect your Stripe account to receive payments from bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Benefits */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium">Fast Payouts</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive payments automatically 3 days after each experience is completed
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium">Transparent Commission</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You keep 80% of each booking. Hotels get 12% and Traverum takes 8%.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium">Secure & Trusted</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Stripe handles all payments securely. We never store your banking details.
                </p>
              </div>
            </div>

            {/* What you'll need */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-3">What you'll need:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Business registration details (if applicable)</li>
                <li>• VAT number (for EU businesses)</li>
                <li>• Bank account for payouts</li>
                <li>• 5 minutes to complete setup</li>
              </ul>
            </div>

            {/* CTA */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleConnectStripe}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Continue to Stripe'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to Stripe to complete the secure setup process
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Webhook signature verification failed:', errMessage);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Parse event without verification (for testing)
      console.warn('No webhook secret configured, skipping signature verification');
      event = JSON.parse(body);
    }

    console.log('Received webhook event:', event.type);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('Account updated:', account.id);
        
        // Check if onboarding is complete
        const chargesEnabled = account.charges_enabled;
        const payoutsEnabled = account.payouts_enabled;
        const detailsSubmitted = account.details_submitted;
        
        console.log('Account status:', { chargesEnabled, payoutsEnabled, detailsSubmitted });

        if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
          // Update the partner record to mark onboarding as complete
          const { error: updateError } = await supabase
            .from('partners')
            .update({ stripe_onboarding_complete: true })
            .eq('stripe_account_id', account.id);

          if (updateError) {
            console.error('Failed to update partner onboarding status:', updateError);
          } else {
            console.log('Partner onboarding marked as complete for account:', account.id);
          }
        }
        break;
      }

      case 'account.application.deauthorized': {
        const account = event.data.object as Stripe.Account;
        console.log('Account deauthorized:', account.id);
        
        // Reset the partner's Stripe connection
        const { error: updateError } = await supabase
          .from('partners')
          .update({ 
            stripe_account_id: null,
            stripe_onboarding_complete: false 
          })
          .eq('stripe_account_id', account.id);

        if (updateError) {
          console.error('Failed to reset partner Stripe connection:', updateError);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

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
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get partner data for this user
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('partner_id')
      .eq('auth_id', user.id)
      .single();

    if (userDataError || !userData?.partner_id) {
      throw new Error('User has no partner associated');
    }

    const partnerId = userData.partner_id;

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, email, name, stripe_account_id')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      throw new Error('Partner not found');
    }

    // Check if partner already has a Stripe account
    let stripeAccountId = partner.stripe_account_id;

    if (!stripeAccountId) {
      // Create a new Stripe Connect Express account
      console.log('Creating new Stripe Connect account for partner:', partnerId);
      
      const account = await stripe.accounts.create({
        type: 'express',
        email: partner.email,
        metadata: {
          partner_id: partnerId,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      // Save the Stripe account ID to the partner record
      const { error: updateError } = await supabase
        .from('partners')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', partnerId);

      if (updateError) {
        console.error('Failed to save Stripe account ID:', updateError);
        throw new Error('Failed to save Stripe account');
      }

      console.log('Stripe account created:', stripeAccountId);
    }

    // Get the origin from the request for return URLs
    const { origin } = await req.json().catch(() => ({ origin: null }));
    const baseUrl = origin || 'https://lovable.dev';

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/supplier/stripe-connect?refresh=true`,
      return_url: `${baseUrl}/supplier/dashboard?stripe=success`,
      type: 'account_onboarding',
    });

    console.log('Account link created for:', stripeAccountId);

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId: stripeAccountId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-connect-account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

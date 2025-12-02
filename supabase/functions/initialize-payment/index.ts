import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitializePaymentRequest {
  email: string;
  amount: number; // in kobo (e.g., 50000 = ₦500)
  metadata?: Record<string, any>;
  callback_url?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Initializing payment for user:', user.id);

    const { email, amount, metadata = {}, callback_url } = await req.json() as InitializePaymentRequest;

    // Validate inputs
    if (!email || !amount || amount <= 0) {
      throw new Error('Invalid email or amount');
    }

    // Initialize transaction with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount, // Amount in kobo
        metadata: {
          user_id: user.id,
          ...metadata,
        },
        callback_url: callback_url || `${Deno.env.get('SUPABASE_URL')}/payment-callback`,
      }),
    });

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json();
      console.error('Paystack API error:', errorData);
      throw new Error(`Paystack API error: ${errorData.message || 'Unknown error'}`);
    }

    const paystackData = await paystackResponse.json();
    console.log('Payment initialized successfully:', paystackData.data.reference);

    // Log transaction to ledger
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert({
        user_id: user.id,
        type: 'payment_initialization',
        amount,
        status: 'pending',
        description: 'Payment initialized',
        provider_reference: paystackData.data.reference,
        metadata: {
          email,
          access_code: paystackData.data.access_code,
          ...metadata,
        },
      });

    if (ledgerError) {
      console.error('Error logging to ledger:', ledgerError);
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference: paystackData.data.reference,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in initialize-payment function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  reference: string;
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

    console.log('Verifying payment for user:', user.id);

    const { reference } = await req.json() as VerifyPaymentRequest;

    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json();
      console.error('Paystack verification error:', errorData);
      throw new Error(`Paystack API error: ${errorData.message || 'Unknown error'}`);
    }

    const paystackData = await paystackResponse.json();
    const transactionData = paystackData.data;

    console.log('Payment verification result:', {
      reference,
      status: transactionData.status,
      amount: transactionData.amount,
    });

    // Verify the transaction belongs to this user
    if (transactionData.metadata?.user_id !== user.id) {
      console.error('User mismatch:', {
        expected: user.id,
        received: transactionData.metadata?.user_id,
      });
      throw new Error('Unauthorized: Transaction does not belong to user');
    }

    // Update ledger based on verification result
    if (transactionData.status === 'success') {
      // Get current wallet balance
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching wallet:', fetchError);
        throw new Error('Failed to fetch wallet');
      }

      // Update wallet balance
      const newBalance = (wallet?.balance || 0) + transactionData.amount;
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (walletError) {
        console.error('Error updating wallet:', walletError);
      }

      // Log successful transaction
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: transactionData.amount,
          status: 'completed',
          description: 'Payment successful',
          provider_reference: reference,
          metadata: {
            channel: transactionData.channel,
            paid_at: transactionData.paid_at,
            authorization: transactionData.authorization,
          },
        });

      if (ledgerError) {
        console.error('Error logging to ledger:', ledgerError);
      }

      // Save card authorization if available
      if (transactionData.authorization) {
        const { error: membershipError } = await supabase
          .from('memberships')
          .update({
            authorization_code: transactionData.authorization.authorization_code,
            card_brand: transactionData.authorization.brand,
            card_last4: transactionData.authorization.last4,
          })
          .eq('user_id', user.id)
          .is('authorization_code', null);

        if (membershipError) {
          console.error('Error saving card authorization:', membershipError);
        }
      }
    } else {
      // Log failed transaction
      const { error: ledgerError } = await supabase
        .from('ledger')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: transactionData.amount,
          status: 'failed',
          description: `Payment ${transactionData.status}`,
          provider_reference: reference,
          metadata: transactionData,
        });

      if (ledgerError) {
        console.error('Error logging failed transaction:', ledgerError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          status: transactionData.status,
          amount: transactionData.amount,
          reference: transactionData.reference,
          paid_at: transactionData.paid_at,
          channel: transactionData.channel,
          authorization: transactionData.authorization,
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
    console.error('Error in verify-payment function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: error.message.includes('Unauthorized') ? 401 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

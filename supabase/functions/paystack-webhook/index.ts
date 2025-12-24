import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

/**
 * Verify Paystack webhook signature
 */
async function verifyPaystackSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = encoder.encode(secret);
  
  // Create HMAC-SHA512 hash
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex === signature;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook received:', req.method);

    // Get the raw body as text for signature verification
    const rawBody = await req.text();
    const paystackSignature = req.headers.get('x-paystack-signature');

    if (!paystackSignature) {
      console.error('No Paystack signature found in headers');
      throw new Error('No signature provided');
    }

    // Verify webhook signature
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
    const isValid = await verifyPaystackSignature(rawBody, paystackSignature, secret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      throw new Error('Invalid signature');
    }

    console.log('Webhook signature verified successfully');

    // Parse the webhook payload
    const event = JSON.parse(rawBody);
    
    console.log('Webhook event:', {
      type: event.event,
      reference: event.data?.reference,
    });

    // Create Supabase admin client (service role)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Log webhook to database
    const { error: webhookLogError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: event.event,
        payload: event,
        processed: false,
      });

    if (webhookLogError) {
      console.error('Error logging webhook:', webhookLogError);
    }

    // Handle different webhook events
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(supabase, event.data);
        break;

      case 'charge.failed':
        await handleChargeFailed(supabase, event.data);
        break;

      case 'subscription.create':
      case 'subscription.disable':
      case 'subscription.not_renew':
        console.log(`Subscription event: ${event.event}`);
        // Handle subscription events if needed
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('event_type', event.event)
      .eq('processed', false)
      .order('received_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in paystack-webhook function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Invalid signature' ? 401 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

/**
 * Handle successful charge
 */
async function handleChargeSuccess(supabase: any, data: any) {
  console.log('Processing successful charge:', data.reference);

  const userId = data.metadata?.user_id;
  const chargeType = data.metadata?.charge_type;
  
  if (!userId) {
    console.error('No user_id in metadata');
    return;
  }

  try {
    // Handle Ajo contribution charges
    if (chargeType === 'ajo_contribution') {
      await handleContributionSuccess(supabase, data);
      return;
    }

    // Handle wallet funding (default behavior)
    const { data: wallet, error: walletFetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletFetchError) {
      console.error('Error fetching wallet:', walletFetchError);
      return;
    }

    const newBalance = (wallet?.balance || 0) + data.amount;

    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (walletUpdateError) {
      console.error('Error updating wallet:', walletUpdateError);
      return;
    }

    // Log transaction to ledger
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: data.amount,
        status: 'completed',
        description: 'Payment successful (webhook)',
        provider_reference: data.reference,
        metadata: {
          channel: data.channel,
          paid_at: data.paid_at,
          ip_address: data.ip_address,
        },
      });

    if (ledgerError) {
      console.error('Error logging to ledger:', ledgerError);
    }

    console.log('Charge processed successfully:', {
      userId,
      amount: data.amount,
      newBalance,
    });
  } catch (error) {
    console.error('Error in handleChargeSuccess:', error);
  }
}

/**
 * Handle successful Ajo contribution
 */
async function handleContributionSuccess(supabase: any, data: any) {
  const { user_id, membership_id, ajo_id, cycle } = data.metadata;
  
  console.log('Processing successful contribution:', { user_id, membership_id, ajo_id });

  try {
    // Update ledger entry from pending to completed
    const { error: ledgerUpdateError } = await supabase
      .from('ledger')
      .update({
        status: 'completed',
        metadata: {
          ...data.metadata,
          paid_at: data.paid_at,
          channel: data.channel,
        },
      })
      .eq('provider_reference', data.reference)
      .eq('type', 'contribution');

    if (ledgerUpdateError) {
      console.error('Error updating ledger:', ledgerUpdateError);
    }

    // Calculate next debit date based on cycle type
    const { data: ajo, error: ajoError } = await supabase
      .from('ajos')
      .select('cycle_type')
      .eq('id', ajo_id)
      .single();

    if (!ajoError && ajo) {
      let nextDebitDate = new Date();
      switch (ajo.cycle_type) {
        case 'weekly':
          nextDebitDate.setDate(nextDebitDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDebitDate.setDate(nextDebitDate.getDate() + 14);
          break;
        case 'monthly':
          nextDebitDate.setMonth(nextDebitDate.getMonth() + 1);
          break;
        default:
          nextDebitDate.setMonth(nextDebitDate.getMonth() + 1);
      }

      // Update membership with next debit date and reset retry count
      const { error: membershipError } = await supabase
        .from('memberships')
        .update({
          next_debit_date: nextDebitDate.toISOString(),
          retry_count: 0,
        })
        .eq('id', membership_id);

      if (membershipError) {
        console.error('Error updating membership:', membershipError);
      }
    }

    console.log('Contribution processed successfully:', {
      user_id,
      amount: data.amount,
      reference: data.reference,
    });
  } catch (error) {
    console.error('Error in handleContributionSuccess:', error);
  }
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(supabase: any, data: any) {
  console.log('Processing failed charge:', data.reference);

  const userId = data.metadata?.user_id;
  const chargeType = data.metadata?.charge_type;
  
  if (!userId) {
    console.error('No user_id in metadata');
    return;
  }

  try {
    // Handle Ajo contribution failures
    if (chargeType === 'ajo_contribution') {
      await handleContributionFailed(supabase, data);
      return;
    }

    // Handle wallet funding failures (default behavior)
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: data.amount,
        status: 'failed',
        description: 'Payment failed (webhook)',
        provider_reference: data.reference,
        metadata: data,
      });

    if (ledgerError) {
      console.error('Error logging failed transaction:', ledgerError);
    }

    console.log('Failed charge logged:', {
      userId,
      amount: data.amount,
      reference: data.reference,
    });
  } catch (error) {
    console.error('Error in handleChargeFailed:', error);
  }
}

/**
 * Handle failed Ajo contribution
 */
async function handleContributionFailed(supabase: any, data: any) {
  const { user_id, membership_id, ajo_id } = data.metadata;
  
  console.log('Processing failed contribution:', { user_id, membership_id, ajo_id });

  try {
    // Update ledger entry from pending to failed
    const { error: ledgerUpdateError } = await supabase
      .from('ledger')
      .update({
        status: 'failed',
        metadata: {
          ...data.metadata,
          failure_reason: data.gateway_response || 'Payment failed',
        },
      })
      .eq('provider_reference', data.reference)
      .eq('type', 'contribution');

    if (ledgerUpdateError) {
      console.error('Error updating ledger:', ledgerUpdateError);
    }

    // Increment retry count on membership
    const { data: membership, error: membershipFetchError } = await supabase
      .from('memberships')
      .select('retry_count')
      .eq('id', membership_id)
      .single();

    if (!membershipFetchError && membership) {
      const { error: membershipError } = await supabase
        .from('memberships')
        .update({
          retry_count: (membership.retry_count || 0) + 1,
        })
        .eq('id', membership_id);

      if (membershipError) {
        console.error('Error updating membership retry count:', membershipError);
      }
    }

    console.log('Failed contribution logged:', {
      user_id,
      amount: data.amount,
      reference: data.reference,
    });
  } catch (error) {
    console.error('Error in handleContributionFailed:', error);
  }
}

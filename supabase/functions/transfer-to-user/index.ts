import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { username, amount } = await req.json();

    if (!username || typeof username !== 'string') {
      throw new Error('Username is required');
    }
    if (!amount || typeof amount !== 'number' || amount < 10000) {
      throw new Error('Minimum transfer amount is ₦100');
    }

    // Look up recipient by username
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, username, full_name')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle();

    if (recipientError || !recipient) {
      throw new Error('User not found with that username');
    }

    if (recipient.user_id === user.id) {
      throw new Error('You cannot send money to yourself');
    }

    // Debit sender wallet atomically
    const { data: debitResult, error: debitError } = await supabaseAdmin
      .rpc('decrement_wallet_balance', { p_user_id: user.id, p_amount: amount });

    if (debitError) {
      console.error('Debit error:', debitError);
      throw new Error(debitError.message || 'Insufficient balance');
    }

    // Credit recipient wallet
    const { error: incrementError } = await supabaseAdmin.rpc('increment_wallet_balance', {
      p_user_id: recipient.user_id,
      p_amount: amount,
    });
      p_user_id: recipient.user_id,
      p_amount: amount,
    });

    if (incrementError) {
      // Rollback: refund sender
      console.error('Credit error, rolling back:', incrementError);
      await supabaseAdmin.rpc('increment_wallet_balance', { p_user_id: user.id, p_amount: amount });
      throw new Error('Failed to credit recipient. Your balance has been restored.');
    }

    // Get sender profile for description
    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('username, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const senderName = senderProfile?.username || senderProfile?.full_name || 'Unknown';

    // Log transactions for both parties
    await supabaseAdmin.from('wallet_transactions').insert([
      {
        user_id: user.id,
        type: 'debit',
        amount,
        description: `Transfer to @${recipient.username}`,
      },
      {
        user_id: recipient.user_id,
        type: 'credit',
        amount,
        description: `Received from @${senderName}`,
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          recipient_name: recipient.full_name,
          recipient_username: recipient.username,
          amount,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Transfer error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: error.message === 'Unauthorized' ? 401 : 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

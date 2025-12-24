import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { membership_id, ajo_id, card_id } = await req.json();

    if (!membership_id || !ajo_id) {
      throw new Error('membership_id and ajo_id are required');
    }

    console.log('Charging contribution:', { membership_id, ajo_id, card_id });

    // Get auth token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Fetch membership details
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*, ajos(*)')
      .eq('id', membership_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      throw new Error('Membership not found or access denied');
    }

    const ajo = membership.ajos;
    if (!ajo) {
      throw new Error('Ajo not found');
    }

    // Get authorization code - either from specific card or membership or user's default card
    let authorizationCode: string | null = null;
    let cardBrand: string | null = null;
    let cardLast4: string | null = null;

    if (card_id) {
      // Use specific card
      const { data: card, error: cardError } = await supabase
        .from('user_cards')
        .select('*')
        .eq('id', card_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (cardError || !card) {
        throw new Error('Card not found or inactive');
      }

      authorizationCode = card.authorization_code;
      cardBrand = card.card_brand;
      cardLast4 = card.card_last4;
    } else if (membership.authorization_code) {
      // Use membership's linked card
      authorizationCode = membership.authorization_code;
      cardBrand = membership.card_brand;
      cardLast4 = membership.card_last4;
    } else {
      // Fall back to user's default card
      const { data: defaultCard, error: defaultCardError } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      if (defaultCardError || !defaultCard) {
        throw new Error('No card available. Please add a card first.');
      }

      authorizationCode = defaultCard.authorization_code;
      cardBrand = defaultCard.card_brand;
      cardLast4 = defaultCard.card_last4;
    }

    if (!authorizationCode) {
      throw new Error('No authorization code available');
    }

    // Get user email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Generate unique reference
    const reference = `ajo_contrib_${membership_id}_${Date.now()}`;

    // Call Paystack charge_authorization
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const chargeResponse = await fetch('https://api.paystack.co/transaction/charge_authorization', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization_code: authorizationCode,
        email: profile.email,
        amount: ajo.contribution_amount, // Amount is already in kobo
        reference,
        metadata: {
          user_id: user.id,
          membership_id,
          ajo_id,
          charge_type: 'ajo_contribution',
          cycle: ajo.current_cycle || 1,
        },
      }),
    });

    const chargeData = await chargeResponse.json();

    console.log('Paystack charge response:', chargeData);

    if (!chargeData.status) {
      throw new Error(chargeData.message || 'Failed to charge card');
    }

    // Log pending contribution to ledger
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert({
        user_id: user.id,
        ajo_id,
        membership_id,
        type: 'contribution',
        amount: ajo.contribution_amount,
        status: chargeData.data.status === 'success' ? 'completed' : 'pending',
        description: `Ajo contribution - ${ajo.name} (Cycle ${ajo.current_cycle || 1})`,
        provider_reference: reference,
        metadata: {
          charge_type: 'ajo_contribution',
          card_brand: cardBrand,
          card_last4: cardLast4,
          paystack_reference: chargeData.data.reference,
        },
      });

    if (ledgerError) {
      console.error('Error logging to ledger:', ledgerError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: chargeData.data.status === 'success' 
          ? 'Contribution charged successfully' 
          : 'Contribution charge initiated',
        data: {
          reference,
          status: chargeData.data.status,
          amount: ajo.contribution_amount,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in charge-contribution:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

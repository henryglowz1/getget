import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  reference: string;
}

interface NotificationPayload {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

async function sendNotificationInternal(
  supabaseAdmin: SupabaseClient,
  payload: NotificationPayload
) {
  // Insert in-app notification
  await supabaseAdmin.from('notifications').insert({
    user_id: payload.user_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data || {},
  });

  // Get user profile for email
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq('user_id', payload.user_id)
    .single();

  // Get user preferences
  const { data: prefs } = await supabaseAdmin
    .from('notification_preferences')
    .select('email_enabled')
    .eq('user_id', payload.user_id)
    .maybeSingle();

  // Send email if enabled
  if (profile && (prefs?.email_enabled !== false)) {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'AjoConnect <onboarding@resend.dev>',
            to: [profile.email],
            subject: `${payload.title} - AjoConnect`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10B981;">${payload.title}</h1>
                <p>Hi ${profile.full_name || 'there'},</p>
                <p>${payload.message}</p>
                <p style="margin-top: 24px;">
                  <a href="https://getget.lovable.app/dashboard" 
                     style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                    Go to Dashboard
                  </a>
                </p>
                <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">
                  — The AjoConnect Team
                </p>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // User context for authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
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
          'Authorization': `Bearer ${paystackSecretKey}`,
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
      metadata: transactionData.metadata,
    });

    // Verify the transaction belongs to this user
    if (transactionData.metadata?.user_id !== user.id) {
      console.error('User mismatch:', {
        expected: user.id,
        received: transactionData.metadata?.user_id,
      });
      throw new Error('Unauthorized: Transaction does not belong to user');
    }

    const isCardTokenization = transactionData.metadata?.type === 'card_tokenization';

    // Update ledger based on verification result
    if (transactionData.status === 'success') {
      // Only update wallet if NOT a card tokenization (refund the test charge)
      if (!isCardTokenization) {
        // Get current wallet balance
        const { data: wallet, error: fetchError } = await supabaseAdmin
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
        const { error: walletError } = await supabaseAdmin
          .from('wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (walletError) {
          console.error('Error updating wallet:', walletError);
        }

        // Log wallet funding transaction
        const { error: ledgerError } = await supabaseAdmin
          .from('ledger')
          .insert({
            user_id: user.id,
            type: 'deposit',
            amount: transactionData.amount,
            status: 'completed',
            description: 'Wallet funding',
            provider_reference: reference,
            metadata: {
              channel: transactionData.channel,
              paid_at: transactionData.paid_at,
            },
          });

        if (ledgerError) {
          console.error('Error logging to ledger:', ledgerError);
        }

        // Also record in wallet_transactions
        await supabaseAdmin.from('wallet_transactions').insert({
          user_id: user.id,
          type: 'credit',
          amount: transactionData.amount,
          description: 'Wallet funding via Paystack',
        });

        // Send notification for successful wallet funding
        try {
          await sendNotificationInternal(supabaseAdmin, {
            user_id: user.id,
            type: 'payment_success',
            title: 'Wallet Funded Successfully! 💰',
            message: `₦${(transactionData.amount / 100).toLocaleString()} has been added to your wallet.`,
            data: { amount: transactionData.amount, reference },
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }

        // Process referral reward for first-time wallet funding
        try {
          // Check if user has a pending referral
          const { data: pendingReferral } = await supabaseAdmin
            .from('referrals')
            .select('id, referrer_id, reward_amount')
            .eq('referred_user_id', user.id)
            .eq('status', 'pending')
            .maybeSingle();

          if (pendingReferral) {
            console.log('Processing referral reward for user:', user.id);
            // Call the database function to process the referral reward
            const { error: rewardError } = await supabaseAdmin
              .rpc('process_referral_reward', { p_referred_user_id: user.id });

            if (rewardError) {
              console.error('Error processing referral reward:', rewardError);
            } else {
              console.log('Referral reward processed successfully');
              // Notify the referrer about their bonus
              await sendNotificationInternal(supabaseAdmin, {
                user_id: pendingReferral.referrer_id,
                type: 'referral_bonus',
                title: 'Referral Bonus Earned! 🎁',
                message: `Congratulations! You earned ₦${((pendingReferral.reward_amount || 20000) / 100).toLocaleString()} for referring a friend who just made their first deposit.`,
                data: { amount: pendingReferral.reward_amount },
              });
            }
          }
        } catch (refError) {
          console.error('Error checking/processing referral:', refError);
          // Don't fail the payment verification if referral processing fails
        }
      } else {
        // Card tokenization - log the verification charge
        const { error: ledgerError } = await supabaseAdmin
          .from('ledger')
          .insert({
            user_id: user.id,
            type: 'card_verification',
            amount: transactionData.amount,
            status: 'completed',
            description: 'Card verification charge',
            provider_reference: reference,
            metadata: {
              type: 'card_tokenization',
              channel: transactionData.channel,
              paid_at: transactionData.paid_at,
            },
          });

        if (ledgerError) {
          console.error('Error logging card verification to ledger:', ledgerError);
        }
      }

      // Save card authorization to user_cards if available
      if (transactionData.authorization && transactionData.authorization.reusable) {
        const auth = transactionData.authorization;
        console.log('Saving card authorization:', {
          brand: auth.brand,
          last4: auth.last4,
          bank: auth.bank,
        });
        
        // Check if card already exists
        const { data: existingCard } = await supabaseAdmin
          .from('user_cards')
          .select('id')
          .eq('user_id', user.id)
          .eq('authorization_code', auth.authorization_code)
          .maybeSingle();

        if (!existingCard) {
          // Check if user has any cards - if not, make this default
          const { count } = await supabaseAdmin
            .from('user_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_active', true);

          const { error: cardError } = await supabaseAdmin
            .from('user_cards')
            .insert({
              user_id: user.id,
              authorization_code: auth.authorization_code,
              card_brand: auth.brand || auth.card_type || 'Unknown',
              card_last4: auth.last4,
              exp_month: auth.exp_month,
              exp_year: auth.exp_year,
              bank_name: auth.bank,
              is_default: count === 0, // First card is default
              is_active: true,
            });

          if (cardError) {
            console.error('Error saving card:', cardError);
          } else {
            console.log('Card saved successfully');
          }
        } else {
          console.log('Card already exists, skipping save');
        }

        // Also update memberships for backward compatibility
        const { error: membershipError } = await supabaseAdmin
          .from('memberships')
          .update({
            authorization_code: auth.authorization_code,
            card_brand: auth.brand,
            card_last4: auth.last4,
          })
          .eq('user_id', user.id)
          .is('authorization_code', null);

        if (membershipError) {
          console.error('Error saving card to membership:', membershipError);
        }
      } else {
        console.log('No reusable authorization found:', transactionData.authorization);
      }
    } else {
      // Log failed transaction
      const { error: ledgerError } = await supabaseAdmin
        .from('ledger')
        .insert({
          user_id: user.id,
          type: isCardTokenization ? 'card_verification' : 'deposit',
          amount: transactionData.amount,
          status: 'failed',
          description: `Payment ${transactionData.status}`,
          provider_reference: reference,
          metadata: {
            gateway_response: transactionData.gateway_response,
          },
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
          metadata: transactionData.metadata,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

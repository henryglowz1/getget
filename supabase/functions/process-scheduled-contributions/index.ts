import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Membership {
  id: string;
  user_id: string;
  ajo_id: string;
  authorization_code: string | null;
  card_brand: string | null;
  card_last4: string | null;
  next_debit_date: string | null;
  retry_count: number | null;
  is_active: boolean | null;
  position: number;
  ajos: {
    id: string;
    name: string;
    contribution_amount: number;
    cycle_type: string;
    current_cycle: number | null;
    status: string;
  };
}

interface UserCard {
  id: string;
  authorization_code: string;
  card_brand: string;
  card_last4: string;
  is_default: boolean | null;
  is_active: boolean | null;
}

interface Profile {
  email: string;
  full_name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting scheduled contributions processing...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query memberships that are due for processing
    const now = new Date().toISOString();
    console.log(`Querying memberships due as of ${now}`);

    const { data: dueMemberships, error: queryError } = await supabase
      .from("memberships")
      .select("*, ajos(*)")
      .lte("next_debit_date", now)
      .eq("is_active", true)
      .lt("retry_count", 3);

    if (queryError) {
      console.error("Error querying memberships:", queryError);
      throw queryError;
    }

    if (!dueMemberships || dueMemberships.length === 0) {
      console.log("No memberships due for processing");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No memberships due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${dueMemberships.length} memberships to process`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each membership
    for (const membership of dueMemberships as Membership[]) {
      console.log(`Processing membership ${membership.id} for user ${membership.user_id}`);

      try {
        // Skip if Ajo is not active
        if (!membership.ajos || membership.ajos.status !== "active") {
          console.log(`Skipping membership ${membership.id}: Ajo not active`);
          results.skipped++;
          continue;
        }

        // Get user profile for email
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", membership.user_id)
          .single();

        if (profileError || !profile?.email) {
          console.error(`No profile found for user ${membership.user_id}`);
          results.skipped++;
          results.errors.push(`No profile for membership ${membership.id}`);
          continue;
        }

        // Determine authorization code
        let authorizationCode = membership.authorization_code;
        let cardBrand = membership.card_brand;
        let cardLast4 = membership.card_last4;

        // If no membership card, try to get user's default or active card
        if (!authorizationCode) {
          const { data: userCards, error: cardsError } = await supabase
            .from("user_cards")
            .select("*")
            .eq("user_id", membership.user_id)
            .eq("is_active", true)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false });

          if (cardsError) {
            console.error(`Error fetching cards for user ${membership.user_id}:`, cardsError);
          }

          if (userCards && userCards.length > 0) {
            const selectedCard = userCards[0] as UserCard;
            authorizationCode = selectedCard.authorization_code;
            cardBrand = selectedCard.card_brand;
            cardLast4 = selectedCard.card_last4;
            console.log(`Using user card ${cardLast4} for membership ${membership.id}`);
          }
        }

        if (!authorizationCode) {
          console.log(`Skipping membership ${membership.id}: No valid card found`);
          results.skipped++;
          results.errors.push(`No card for membership ${membership.id}`);
          continue;
        }

        // Generate unique reference
        const reference = `ajo_${membership.ajo_id}_${membership.id}_${Date.now()}`;
        const amountInKobo = membership.ajos.contribution_amount;

        console.log(`Charging ${amountInKobo} kobo for membership ${membership.id}`);

        // Call Paystack charge_authorization
        const paystackResponse = await fetch("https://api.paystack.co/transaction/charge_authorization", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authorization_code: authorizationCode,
            email: profile.email,
            amount: amountInKobo,
            reference: reference,
            metadata: {
              charge_type: "ajo_contribution",
              membership_id: membership.id,
              ajo_id: membership.ajo_id,
              ajo_name: membership.ajos.name,
              cycle: membership.ajos.current_cycle || 1,
              user_id: membership.user_id,
              card_last4: cardLast4,
              card_brand: cardBrand,
              scheduled: true,
            },
          }),
        });

        const paystackResult = await paystackResponse.json();
        console.log(`Paystack response for ${membership.id}:`, JSON.stringify(paystackResult));

        if (paystackResult.status === true) {
          // Log pending transaction to ledger
          const { error: ledgerError } = await supabase.from("ledger").insert({
            user_id: membership.user_id,
            ajo_id: membership.ajo_id,
            membership_id: membership.id,
            amount: amountInKobo,
            type: "debit",
            status: "pending",
            description: `Scheduled contribution for ${membership.ajos.name}`,
            provider_reference: paystackResult.data?.reference || reference,
            metadata: {
              charge_type: "ajo_contribution",
              cycle: membership.ajos.current_cycle || 1,
              scheduled: true,
              card_last4: cardLast4,
              card_brand: cardBrand,
            },
          });

          if (ledgerError) {
            console.error(`Error logging to ledger for ${membership.id}:`, ledgerError);
          }

          results.successful++;
          console.log(`Successfully initiated charge for membership ${membership.id}`);
        } else {
          console.error(`Paystack charge failed for ${membership.id}:`, paystackResult.message);
          results.failed++;
          results.errors.push(`Paystack failed for ${membership.id}: ${paystackResult.message}`);

          // Increment retry count for immediate failures
          await supabase
            .from("memberships")
            .update({ retry_count: (membership.retry_count || 0) + 1 })
            .eq("id", membership.id);
        }

        results.processed++;
      } catch (membershipError) {
        console.error(`Error processing membership ${membership.id}:`, membershipError);
        results.failed++;
        results.errors.push(`Error for ${membership.id}: ${String(membershipError)}`);
      }
    }

    console.log("Processing complete:", JSON.stringify(results));

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-scheduled-contributions:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

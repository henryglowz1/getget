import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Ajo {
  id: string;
  name: string;
  contribution_amount: number;
  cycle_type: string;
  current_cycle: number;
  status: string;
  max_members: number;
  withdrawal_order: string[] | null;
  fee_percentage: number | null;
}

interface Membership {
  id: string;
  user_id: string;
  position: number;
  is_active: boolean;
}

interface LinkedBank {
  id: string;
  user_id: string;
  recipient_code: string;
  bank_name: string;
  account_number: string;
  is_default: boolean;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting cycle payout processing...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional: Process specific ajo_id if provided
    let ajoIdFilter: string | null = null;
    try {
      const body = await req.json();
      ajoIdFilter = body?.ajo_id || null;
    } catch {
      // No body provided, process all eligible ajos
    }

    // Get all active ajos
    let ajoQuery = supabase
      .from("ajos")
      .select("*")
      .eq("status", "active");

    if (ajoIdFilter) {
      ajoQuery = ajoQuery.eq("id", ajoIdFilter);
    }

    const { data: ajos, error: ajosError } = await ajoQuery;

    if (ajosError) {
      console.error("Error fetching ajos:", ajosError);
      throw ajosError;
    }

    if (!ajos || ajos.length === 0) {
      console.log("No active ajos found");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No active ajos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      processed: 0,
      payouts_initiated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const ajo of ajos as Ajo[]) {
      console.log(`Processing ajo: ${ajo.name} (${ajo.id}), cycle: ${ajo.current_cycle}`);

      try {
        // Get active memberships for this ajo
        const { data: memberships, error: membersError } = await supabase
          .from("memberships")
          .select("*")
          .eq("ajo_id", ajo.id)
          .eq("is_active", true);

        if (membersError) {
          console.error(`Error fetching memberships for ajo ${ajo.id}:`, membersError);
          results.errors.push(`Failed to fetch memberships for ${ajo.name}`);
          continue;
        }

        if (!memberships || memberships.length === 0) {
          console.log(`No active members in ajo ${ajo.name}`);
          results.skipped++;
          continue;
        }

        const memberCount = memberships.length;
        const currentCycle = ajo.current_cycle || 1;

        // Check if all members have paid for current cycle
        // Count completed contributions for this ajo and cycle
        const { data: completedContributions, error: contribError } = await supabase
          .from("ledger")
          .select("*")
          .eq("ajo_id", ajo.id)
          .eq("type", "debit")
          .eq("status", "completed")
          .contains("metadata", { cycle: currentCycle, charge_type: "ajo_contribution" });

        if (contribError) {
          console.error(`Error fetching contributions for ajo ${ajo.id}:`, contribError);
          results.errors.push(`Failed to fetch contributions for ${ajo.name}`);
          continue;
        }

        // Get unique users who have paid
        const paidUserIds = new Set(completedContributions?.map(c => c.user_id) || []);
        const allMembersPaid = memberships.every(m => paidUserIds.has(m.user_id));

        console.log(`Ajo ${ajo.name}: ${paidUserIds.size}/${memberCount} members paid for cycle ${currentCycle}`);

        if (!allMembersPaid) {
          console.log(`Skipping ajo ${ajo.name}: Not all members have paid`);
          results.skipped++;
          continue;
        }

        // Check if payout already exists for this cycle
        const { data: existingPayout, error: payoutCheckError } = await supabase
          .from("ledger")
          .select("*")
          .eq("ajo_id", ajo.id)
          .eq("type", "payout")
          .contains("metadata", { cycle: currentCycle })
          .maybeSingle();

        if (payoutCheckError) {
          console.error(`Error checking existing payout:`, payoutCheckError);
        }

        if (existingPayout) {
          console.log(`Payout already processed for ajo ${ajo.name} cycle ${currentCycle}`);
          results.skipped++;
          continue;
        }

        // Determine recipient based on withdrawal_order or position
        let recipientUserId: string | null = null;
        const withdrawalOrder = ajo.withdrawal_order as string[] | null;

        if (withdrawalOrder && withdrawalOrder.length > 0) {
          // Use withdrawal_order - cycle is 1-indexed, array is 0-indexed
          const orderIndex = (currentCycle - 1) % withdrawalOrder.length;
          recipientUserId = withdrawalOrder[orderIndex];
          console.log(`Using withdrawal_order: index ${orderIndex}, user ${recipientUserId}`);
        } else {
          // Fallback: use position-based order
          const recipientMembership = memberships.find(
            (m: Membership) => m.position === currentCycle
          );
          recipientUserId = recipientMembership?.user_id || null;
          console.log(`Using position-based: position ${currentCycle}, user ${recipientUserId}`);
        }

        if (!recipientUserId) {
          console.error(`No recipient found for ajo ${ajo.name} cycle ${currentCycle}`);
          results.errors.push(`No recipient for ${ajo.name} cycle ${currentCycle}`);
          continue;
        }

        // Verify recipient is an active member
        const recipientMember = memberships.find((m: Membership) => m.user_id === recipientUserId);
        if (!recipientMember) {
          console.error(`Recipient ${recipientUserId} is not an active member of ${ajo.name}`);
          results.errors.push(`Invalid recipient for ${ajo.name}`);
          continue;
        }

        // Get recipient's default linked bank
        const { data: linkedBanks, error: bankError } = await supabase
          .from("linked_banks")
          .select("*")
          .eq("user_id", recipientUserId)
          .order("is_default", { ascending: false });

        if (bankError || !linkedBanks || linkedBanks.length === 0) {
          console.error(`No linked bank for recipient ${recipientUserId}`);
          results.errors.push(`No bank account for payout recipient in ${ajo.name}`);
          continue;
        }

        const recipientBank = linkedBanks[0] as LinkedBank;

        if (!recipientBank.recipient_code) {
          console.error(`No recipient_code for bank ${recipientBank.id}`);
          results.errors.push(`Bank not configured for transfers in ${ajo.name}`);
          continue;
        }

        // Get recipient profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", recipientUserId)
          .single();

        if (profileError) {
          console.error(`Error fetching profile:`, profileError);
        }

        // Calculate payout amount with group's configured platform fee (default 6.25%)
        const feePercentage = ajo.fee_percentage ?? 6.25;
        const grossAmount = ajo.contribution_amount * memberCount;
        const feeAmount = Math.round(grossAmount * feePercentage / 100);
        const netAmount = grossAmount - feeAmount;
        console.log(`Payout: Gross ${grossAmount}, Fee ${feeAmount} (${feePercentage}%), Net ${netAmount} kobo to ${profile?.full_name || recipientUserId}`);

        // Generate unique reference
        const reference = `PAYOUT_${ajo.id}_C${currentCycle}_${Date.now()}`;

        // Initiate transfer via Paystack (net amount after fee deduction)
        const paystackResponse = await fetch("https://api.paystack.co/transfer", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: "balance",
            amount: netAmount,
            recipient: recipientBank.recipient_code,
            reason: `${ajo.name} - Cycle ${currentCycle} Payout`,
            reference,
          }),
        });

        const paystackResult = await paystackResponse.json();
        console.log(`Paystack transfer response for ${ajo.name}:`, JSON.stringify(paystackResult));

        if (paystackResult.status === true) {
          // Log payout to ledger with fee breakdown
          const { data: ledgerData, error: ledgerError } = await supabase.from("ledger").insert({
            user_id: recipientUserId,
            ajo_id: ajo.id,
            amount: netAmount,
            type: "payout",
            status: paystackResult.data?.status === "success" ? "completed" : "pending",
            description: `${ajo.name} - Cycle ${currentCycle} Payout`,
            provider_reference: reference,
            metadata: {
              cycle: currentCycle,
              member_count: memberCount,
              gross_amount: grossAmount,
              fee_percentage: feePercentage,
              fee_amount: feeAmount,
              net_amount: netAmount,
              transfer_code: paystackResult.data?.transfer_code,
              bank_name: recipientBank.bank_name,
              account_number: recipientBank.account_number,
              recipient_name: profile?.full_name,
            },
          }).select().single();

          if (ledgerError) {
            console.error(`Error logging payout to ledger:`, ledgerError);
          }

          // Log platform fee to platform_fees table
          const { error: feeError } = await supabase.from("platform_fees").insert({
            ajo_id: ajo.id,
            payout_ledger_id: ledgerData?.id || null,
            user_id: recipientUserId,
            gross_amount: grossAmount,
            fee_amount: feeAmount,
            net_amount: netAmount,
            fee_percentage: feePercentage,
            cycle: currentCycle,
          });

          if (feeError) {
            console.error(`Error logging platform fee:`, feeError);
          } else {
            console.log(`Platform fee logged: ${feeAmount} kobo from ${ajo.name} cycle ${currentCycle}`);
          }

          // Advance to next cycle
          const nextCycle = currentCycle + 1;
          const { error: updateError } = await supabase
            .from("ajos")
            .update({ current_cycle: nextCycle })
            .eq("id", ajo.id);

          if (updateError) {
            console.error(`Error advancing cycle for ${ajo.name}:`, updateError);
          } else {
            console.log(`Advanced ${ajo.name} to cycle ${nextCycle}`);
          }

          results.payouts_initiated++;
          console.log(`Payout initiated for ${ajo.name} cycle ${currentCycle}`);
        } else {
          console.error(`Paystack transfer failed for ${ajo.name}:`, paystackResult.message);
          results.errors.push(`Paystack failed for ${ajo.name}: ${paystackResult.message}`);

          // Log failed payout attempt
          await supabase.from("ledger").insert({
            user_id: recipientUserId,
            ajo_id: ajo.id,
            amount: netAmount,
            type: "payout",
            status: "failed",
            description: `${ajo.name} - Cycle ${currentCycle} Payout (Failed)`,
            provider_reference: reference,
            metadata: {
              cycle: currentCycle,
              gross_amount: grossAmount,
              fee_amount: feeAmount,
              net_amount: netAmount,
              error: paystackResult.message,
            },
          });
        }

        results.processed++;
      } catch (ajoError) {
        console.error(`Error processing ajo ${ajo.id}:`, ajoError);
        results.errors.push(`Error for ${ajo.name}: ${String(ajoError)}`);
      }
    }

    console.log("Payout processing complete:", JSON.stringify(results));

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-cycle-payout:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

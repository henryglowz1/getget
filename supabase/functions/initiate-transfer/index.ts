import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TransferRequest {
  amount: number; // in kobo
  recipient_code: string;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("PAYSTACK_SECRET_KEY is not configured");
    }

    // Get authorization header for user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, recipient_code, reason }: TransferRequest = await req.json();

    console.log("Transfer request:", { userId: user.id, amount, recipient_code, reason });

    // Validate amount (minimum ₦100 = 10000 kobo)
    if (!amount || amount < 10000) {
      return new Response(
        JSON.stringify({ success: false, error: "Minimum withdrawal amount is ₦100" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!recipient_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Recipient code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for admin operations
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the recipient belongs to this user
    const { data: linkedBank, error: bankError } = await supabaseAdmin
      .from("linked_banks")
      .select("*")
      .eq("user_id", user.id)
      .eq("recipient_code", recipient_code)
      .maybeSingle();

    if (bankError || !linkedBank) {
      console.error("Bank verification error:", bankError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid bank account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for concurrent pending withdrawals (rate limiting)
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    const { count: pendingCount } = await supabaseAdmin
      .from("ledger")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "withdrawal")
      .eq("status", "pending")
      .gte("created_at", fiveSecondsAgo);

    if (pendingCount && pendingCount > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "A withdrawal is already in progress. Please wait." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique reference
    const reference = `WD_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // ATOMICALLY deduct from wallet using the secure function
    // This prevents race conditions by locking the row during the transaction
    const { data: balanceResult, error: decrementError } = await supabaseAdmin
      .rpc("decrement_wallet_balance", {
        p_user_id: user.id,
        p_amount: amount
      });

    if (decrementError) {
      console.error("Failed to deduct balance:", decrementError);
      const errorMessage = decrementError.message.includes("Insufficient balance")
        ? "Insufficient balance"
        : decrementError.message.includes("Wallet not found")
        ? "Wallet not found"
        : "Failed to process withdrawal";
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record pending ledger entry BEFORE calling Paystack
    const { error: ledgerError } = await supabaseAdmin.from("ledger").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: -amount,
      status: "pending",
      description: `Withdrawal to ${linkedBank.bank_name}`,
      provider_reference: reference,
      metadata: {
        bank_name: linkedBank.bank_name,
        account_number: linkedBank.account_number,
      },
    });

    if (ledgerError) {
      console.error("Failed to create ledger entry:", ledgerError);
      // Refund the balance since we couldn't proceed
      await supabaseAdmin.rpc("decrement_wallet_balance", {
        p_user_id: user.id,
        p_amount: -amount // Negative to add back
      });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to process withdrawal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initiate transfer with Paystack
    const paystackResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount,
        recipient: recipient_code,
        reason: reason || "Wallet withdrawal",
        reference,
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack transfer response:", paystackData);

    if (!paystackData.status) {
      // Paystack failed - refund the balance and update ledger
      console.error("Paystack transfer failed:", paystackData);
      
      await supabaseAdmin.rpc("decrement_wallet_balance", {
        p_user_id: user.id,
        p_amount: -amount // Negative to add back
      });
      
      await supabaseAdmin
        .from("ledger")
        .update({ status: "failed", metadata: { ...linkedBank, error: paystackData.message } })
        .eq("provider_reference", reference);
      
      return new Response(
        JSON.stringify({ success: false, error: paystackData.message || "Transfer initiation failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update ledger with transfer code
    await supabaseAdmin
      .from("ledger")
      .update({ 
        metadata: {
          transfer_code: paystackData.data.transfer_code,
          bank_name: linkedBank.bank_name,
          account_number: linkedBank.account_number,
        }
      })
      .eq("provider_reference", reference);

    // Record transaction
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: -amount,
      description: `Withdrawal to ${linkedBank.bank_name} - ${linkedBank.account_number}`,
      reference_id: paystackData.data.id?.toString(),
    });

    console.log("Transfer initiated successfully:", { reference, userId: user.id });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reference,
          transfer_code: paystackData.data.transfer_code,
          status: paystackData.data.status,
          amount,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Transfer error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
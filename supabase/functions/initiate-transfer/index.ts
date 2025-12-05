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

    // Verify the recipient belongs to this user
    const { data: linkedBank, error: bankError } = await supabase
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

    // Check wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError || !wallet) {
      console.error("Wallet error:", walletError);
      return new Response(
        JSON.stringify({ success: false, error: "Wallet not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (wallet.balance < amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique reference
    const reference = `WD_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
      throw new Error(paystackData.message || "Transfer initiation failed");
    }

    // Use service role to update wallet and create transaction records
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Deduct from wallet
    const { error: updateError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: wallet.balance - amount })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update wallet:", updateError);
      // Note: Transfer was already initiated, this is a critical error
      throw new Error("Failed to update wallet balance");
    }

    // Record transaction
    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: -amount,
      description: `Withdrawal to ${linkedBank.bank_name} - ${linkedBank.account_number}`,
      reference_id: paystackData.data.id?.toString(),
    });

    // Record in ledger
    await supabaseAdmin.from("ledger").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: -amount,
      status: paystackData.data.status === "success" ? "completed" : "pending",
      description: `Withdrawal to ${linkedBank.bank_name}`,
      provider_reference: reference,
      metadata: {
        transfer_code: paystackData.data.transfer_code,
        bank_name: linkedBank.bank_name,
        account_number: linkedBank.account_number,
      },
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, account_number, bank_code, bank_name } = await req.json();
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackSecretKey) {
      return new Response(JSON.stringify({ error: "Payment configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get list of banks
    if (action === "list_banks") {
      const response = await fetch("https://api.paystack.co/bank", {
        headers: { Authorization: `Bearer ${paystackSecretKey}` },
      });
      const data = await response.json();
      
      if (!data.status) {
        return new Response(JSON.stringify({ error: "Failed to fetch banks" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ banks: data.data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify bank account
    if (action === "verify") {
      if (!account_number || !bank_code) {
        return new Response(JSON.stringify({ error: "Account number and bank code required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
        { headers: { Authorization: `Bearer ${paystackSecretKey}` } }
      );
      const data = await response.json();

      if (!data.status) {
        return new Response(JSON.stringify({ error: data.message || "Could not verify account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        account_name: data.data.account_name,
        account_number: data.data.account_number 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add bank account
    if (action === "add") {
      if (!account_number || !bank_code || !bank_name) {
        return new Response(JSON.stringify({ error: "All bank details required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the account first
      const verifyResponse = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
        { headers: { Authorization: `Bearer ${paystackSecretKey}` } }
      );
      const verifyData = await verifyResponse.json();

      if (!verifyData.status) {
        return new Response(JSON.stringify({ error: verifyData.message || "Could not verify account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accountName = verifyData.data.account_name;

      // Create transfer recipient
      const recipientResponse = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "nuban",
          name: accountName,
          account_number: account_number,
          bank_code: bank_code,
          currency: "NGN",
        }),
      });
      const recipientData = await recipientResponse.json();

      if (!recipientData.status) {
        return new Response(JSON.stringify({ error: recipientData.message || "Failed to create recipient" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const recipientCode = recipientData.data.recipient_code;

      // Check if bank already exists for user
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: existingBank } = await supabaseAdmin
        .from("linked_banks")
        .select("id")
        .eq("user_id", user.id)
        .eq("account_number", account_number)
        .eq("bank_code", bank_code)
        .maybeSingle();

      if (existingBank) {
        return new Response(JSON.stringify({ error: "This bank account is already linked" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user has any banks to determine if this should be default
      const { count } = await supabaseAdmin
        .from("linked_banks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const isDefault = count === 0;

      // Insert the bank
      const { data: newBank, error: insertError } = await supabaseAdmin
        .from("linked_banks")
        .insert({
          user_id: user.id,
          bank_name: bank_name,
          bank_code: bank_code,
          account_number: account_number,
          account_name: accountName,
          recipient_code: recipientCode,
          is_default: isDefault,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save bank account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, bank: newBank }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

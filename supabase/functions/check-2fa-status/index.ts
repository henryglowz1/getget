import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking 2FA status for user ${user_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if 2FA is enabled for this user
    const { data: twoFactor, error } = await supabaseAdmin
      .from("user_two_factor")
      .select("is_enabled")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      console.error("Error checking 2FA status:", error);
      throw new Error("Failed to check 2FA status");
    }

    const isEnabled = twoFactor?.is_enabled || false;
    console.log(`2FA status for user ${user_id}: ${isEnabled ? "enabled" : "disabled"}`);

    return new Response(
      JSON.stringify({ success: true, data: { isEnabled } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("2FA status check error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
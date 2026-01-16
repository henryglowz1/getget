import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TOTP verification implementation
const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(encoded: string): Uint8Array {
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (const char of cleanedInput) {
    const val = base32Chars.indexOf(char);
    if (val === -1) continue;
    
    buffer = (buffer << 5) | val;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      bytes.push((buffer >>> bitsLeft) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const msgBuffer = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength) as ArrayBuffer;
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgBuffer);
  return new Uint8Array(signature);
}

async function generateTOTP(secret: string, timestamp?: number): Promise<string> {
  const time = timestamp || Math.floor(Date.now() / 1000);
  const counter = Math.floor(time / 30);
  
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }
  
  const secretBytes = base32Decode(secret);
  const hmac = await hmacSha1(secretBytes, counterBytes);
  
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, "0");
}

async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  
  // Check current and adjacent time windows (±1 step for clock skew)
  for (const offset of [0, -30, 30]) {
    const expectedCode = await generateTOTP(secret, now + offset);
    if (expectedCode === code) {
      return true;
    }
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, code, purpose } = await req.json();
    
    console.log(`2FA verification request for user ${user_id}, purpose: ${purpose}`);

    if (!user_id || !code) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (code.length !== 6 && code.length !== 9) { // 6 for TOTP, 9 for backup code (XXXX-XXXX)
      return new Response(
        JSON.stringify({ success: false, error: "Invalid code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's 2FA settings
    const { data: twoFactor, error: tfError } = await supabaseAdmin
      .from("user_two_factor")
      .select("totp_secret, is_enabled, backup_codes")
      .eq("user_id", user_id)
      .maybeSingle();

    if (tfError) {
      console.error("Error fetching 2FA settings:", tfError);
      throw new Error("Failed to verify 2FA");
    }

    if (!twoFactor || !twoFactor.is_enabled) {
      // 2FA is not enabled, allow through
      return new Response(
        JSON.stringify({ success: true, data: { verified: true, twoFactorRequired: false } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if it's a backup code (format: XXXX-XXXX)
    if (code.includes("-") && code.length === 9) {
      const backupCodes = twoFactor.backup_codes || [];
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      
      if (codeIndex !== -1) {
        // Valid backup code - remove it from the list
        const updatedCodes = backupCodes.filter((_: string, i: number) => i !== codeIndex);
        await supabaseAdmin
          .from("user_two_factor")
          .update({ backup_codes: updatedCodes })
          .eq("user_id", user_id);
        
        console.log(`Backup code used for user ${user_id}, ${updatedCodes.length} remaining`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { 
              verified: true, 
              twoFactorRequired: true,
              backupCodeUsed: true,
              remainingBackupCodes: updatedCodes.length 
            } 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Verify TOTP code
    const isValid = await verifyTOTP(twoFactor.totp_secret, code);
    
    if (!isValid) {
      console.log(`Invalid 2FA code for user ${user_id}`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`2FA verified successfully for user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, data: { verified: true, twoFactorRequired: true } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("2FA verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
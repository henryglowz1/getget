import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TOTP implementation using HMAC-SHA1
const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Uint8Array): string {
  let result = "";
  let bits = 0;
  let value = 0;
  
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    
    while (bits >= 5) {
      result += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += base32Chars[(value << (5 - bits)) & 31];
  }
  
  return result;
}

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

function generateSecret(): string {
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  return base32Encode(randomBytes);
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

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, code } = await req.json();
    console.log(`2FA action: ${action} for user ${user.id}`);

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email for QR code
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", user.id)
      .single();

    const userEmail = profile?.email || user.email;
    const appName = "AjoConnect";

    if (action === "generate") {
      // Generate new TOTP secret
      const secret = generateSecret();
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail || "")}?secret=${secret}&issuer=${encodeURIComponent(appName)}&algorithm=SHA1&digits=6&period=30`;
      
      // Store secret (not yet enabled)
      const { error: upsertError } = await supabaseAdmin
        .from("user_two_factor")
        .upsert({
          user_id: user.id,
          totp_secret: secret,
          is_enabled: false,
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Failed to store 2FA secret:", upsertError);
        throw new Error("Failed to setup 2FA");
      }

      console.log(`Generated TOTP secret for user ${user.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            secret,
            otpauthUrl,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "enable") {
      // Verify code and enable 2FA
      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: twoFactor } = await supabaseAdmin
        .from("user_two_factor")
        .select("totp_secret")
        .eq("user_id", user.id)
        .single();

      if (!twoFactor?.totp_secret) {
        return new Response(
          JSON.stringify({ success: false, error: "No 2FA setup found. Please generate a new secret." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await verifyTOTP(twoFactor.totp_secret, code);
      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid code. Please try again." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes();

      // Enable 2FA
      const { error: enableError } = await supabaseAdmin
        .from("user_two_factor")
        .update({
          is_enabled: true,
          backup_codes: backupCodes,
        })
        .eq("user_id", user.id);

      if (enableError) {
        console.error("Failed to enable 2FA:", enableError);
        throw new Error("Failed to enable 2FA");
      }

      console.log(`2FA enabled for user ${user.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          data: { backupCodes },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disable") {
      // Verify code and disable 2FA
      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Verification code required to disable 2FA" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: twoFactor } = await supabaseAdmin
        .from("user_two_factor")
        .select("totp_secret")
        .eq("user_id", user.id)
        .single();

      if (!twoFactor?.totp_secret) {
        return new Response(
          JSON.stringify({ success: false, error: "2FA is not enabled" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await verifyTOTP(twoFactor.totp_secret, code);
      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete 2FA record
      await supabaseAdmin
        .from("user_two_factor")
        .delete()
        .eq("user_id", user.id);

      console.log(`2FA disabled for user ${user.id}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      const { data: twoFactor } = await supabaseAdmin
        .from("user_two_factor")
        .select("is_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          data: { isEnabled: twoFactor?.is_enabled || false },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("2FA setup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
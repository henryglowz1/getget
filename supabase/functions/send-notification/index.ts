import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  send_email?: boolean;
  send_push?: boolean;
}

const emailTemplates: Record<string, (data: NotificationPayload & { user_email: string; user_name: string }) => { subject: string; html: string }> = {
  group_invite: (data) => ({
    subject: `You've been invited to join a group on AjoConnect`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">Group Invitation</h1>
        <p>Hi ${data.user_name},</p>
        <p>${data.message}</p>
        <p style="margin-top: 24px;">
          <a href="https://getget.lovable.app/dashboard/groups" 
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            View Invitation
          </a>
        </p>
        <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">
          — The AjoConnect Team
        </p>
      </div>
    `,
  }),
  contribution_reminder: (data) => ({
    subject: `Contribution Reminder - AjoConnect`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #F59E0B;">Contribution Reminder</h1>
        <p>Hi ${data.user_name},</p>
        <p>${data.message}</p>
        <p style="margin-top: 24px;">
          <a href="https://getget.lovable.app/dashboard/groups" 
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            View Groups
          </a>
        </p>
        <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">
          — The AjoConnect Team
        </p>
      </div>
    `,
  }),
  payment_success: (data) => ({
    subject: `Payment Successful - AjoConnect`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">Payment Successful</h1>
        <p>Hi ${data.user_name},</p>
        <p>${data.message}</p>
        <p style="margin-top: 24px;">
          <a href="https://getget.lovable.app/dashboard/transactions" 
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            View Transactions
          </a>
        </p>
        <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">
          — The AjoConnect Team
        </p>
      </div>
    `,
  }),
  payout_received: (data) => ({
    subject: `You've Received a Payout! - AjoConnect`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">🎉 Payout Received!</h1>
        <p>Hi ${data.user_name},</p>
        <p>${data.message}</p>
        <p style="margin-top: 24px;">
          <a href="https://getget.lovable.app/dashboard/wallet" 
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            View Wallet
          </a>
        </p>
        <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">
          — The AjoConnect Team
        </p>
      </div>
    `,
  }),
  referral_bonus: (data) => ({
    subject: `Referral Bonus Earned! - AjoConnect`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8B5CF6;">🎁 Referral Bonus!</h1>
        <p>Hi ${data.user_name},</p>
        <p>${data.message}</p>
        <p style="margin-top: 24px;">
          <a href="https://getget.lovable.app/dashboard/wallet" 
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            View Wallet
          </a>
        </p>
        <p style="color: #6B7280; margin-top: 24px; font-size: 14px;">
          — The AjoConnect Team
        </p>
      </div>
    `,
  }),
  default: (data) => ({
    subject: `${data.title} - AjoConnect`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">${data.title}</h1>
        <p>Hi ${data.user_name},</p>
        <p>${data.message}</p>
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
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: NotificationPayload = await req.json();
    const { user_id, type, title, message, data = {}, send_email = true, send_push = true } = payload;

    // Insert in-app notification
    const { error: insertError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id,
        type,
        title,
        message,
        data,
      });

    if (insertError) {
      console.error("Error inserting notification:", insertError);
      throw insertError;
    }

    // Get user preferences and profile
    const [prefsResult, profileResult] = await Promise.all([
      supabaseAdmin
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle(),
      supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", user_id)
        .single(),
    ]);

    const preferences = prefsResult.data;
    const profile = profileResult.data;

    if (!profile) {
      console.log("User profile not found, skipping email/push");
      return new Response(
        JSON.stringify({ success: true, email_sent: false, push_sent: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let emailSent = false;
    let pushSent = false;

    // Send email if enabled
    if (send_email && (preferences?.email_enabled !== false)) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey) {
        const templateFn = emailTemplates[type] || emailTemplates.default;
        const emailContent = templateFn({
          ...payload,
          user_email: profile.email,
          user_name: profile.full_name || "there",
        });

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "AjoConnect <onboarding@resend.dev>",
              to: [profile.email],
              subject: emailContent.subject,
              html: emailContent.html,
            }),
          });
          
          if (res.ok) {
            emailSent = true;
            console.log("Email sent successfully to", profile.email);
          } else {
            const errorData = await res.text();
            console.error("Error sending email:", errorData);
          }
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }
    }

    // Send push notification if enabled and subscription exists
    if (send_push && preferences?.push_enabled && preferences?.push_subscription) {
      // Push notification sending would require a VAPID key setup
      // For now, we'll just log that push was attempted
      console.log("Push notification would be sent here");
      pushSent = false; // Set to true when actual push is implemented
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: emailSent, push_sent: pushSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-notification function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "group_invite"
  | "group_joined"
  | "join_request"
  | "contribution_reminder"
  | "payment_success"
  | "payout_received"
  | "referral_bonus";

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  sendEmail?: boolean;
  sendPush?: boolean;
}

export async function sendNotification({
  userId,
  type,
  title,
  message,
  data = {},
  sendEmail = true,
  sendPush = true,
}: SendNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-notification", {
      body: {
        user_id: userId,
        type,
        title,
        message,
        data,
        send_email: sendEmail,
        send_push: sendPush,
      },
    });

    if (error) {
      console.error("Error sending notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, ...result };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

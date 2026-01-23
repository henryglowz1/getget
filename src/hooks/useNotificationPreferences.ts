import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  contribution_reminders: boolean;
  group_updates: boolean;
  payment_alerts: boolean;
  push_subscription: Json | null;
  created_at: string;
  updated_at: string;
}

export type NotificationPreferencesUpdate = {
  email_enabled?: boolean;
  push_enabled?: boolean;
  contribution_reminders?: boolean;
  group_updates?: boolean;
  payment_alerts?: boolean;
};

const defaultPreferences = {
  email_enabled: true,
  push_enabled: true,
  contribution_reminders: true,
  group_updates: true,
  payment_alerts: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no preferences exist, create default ones
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id, ...defaultPreferences })
          .select()
          .single();

        if (insertError) throw insertError;
        return newPrefs as NotificationPreferences;
      }

      return data as NotificationPreferences;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: NotificationPreferencesUpdate) => {
      if (!user || !preferences) return;

      const { error } = await supabase
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  const savePushSubscription = useMutation({
    mutationFn: async (subscription: PushSubscription) => {
      if (!user) return;

      const subscriptionJson = subscription.toJSON();
      const { error } = await supabase
        .from("notification_preferences")
        .update({ push_subscription: subscriptionJson as unknown as Json })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences,
    savePushSubscription,
  };
}

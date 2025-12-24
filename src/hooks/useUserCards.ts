import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserCard {
  id: string;
  user_id: string;
  authorization_code: string;
  card_brand: string;
  card_last4: string;
  exp_month: string | null;
  exp_year: string | null;
  bank_name: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserCards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-cards", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserCard[];
    },
    enabled: !!user,
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!user) throw new Error("Not authenticated");

      // First, unset all defaults
      const { error: unsetError } = await supabase
        .from("user_cards")
        .update({ is_default: false })
        .eq("user_id", user.id);

      if (unsetError) throw unsetError;

      // Then set the new default
      const { error: setError } = await supabase
        .from("user_cards")
        .update({ is_default: true })
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (setError) throw setError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cards", user?.id] });
    },
  });

  const removeCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Soft delete - mark as inactive
      const { error } = await supabase
        .from("user_cards")
        .update({ is_active: false })
        .eq("id", cardId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cards", user?.id] });
    },
  });

  const resetCardsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Soft delete all cards
      const { error } = await supabase
        .from("user_cards")
        .update({ is_active: false })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cards", user?.id] });
    },
  });

  return {
    cards: query.data || [],
    isLoading: query.isLoading,
    setDefault: setDefaultMutation.mutateAsync,
    removeCard: removeCardMutation.mutateAsync,
    resetCards: resetCardsMutation.mutateAsync,
    isSettingDefault: setDefaultMutation.isPending,
    isRemoving: removeCardMutation.isPending,
    isResetting: resetCardsMutation.isPending,
  };
}

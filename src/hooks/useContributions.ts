import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Contribution {
  id: string;
  user_id: string;
  ajo_id: string | null;
  membership_id: string | null;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  provider_reference: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export function useContributions(ajoId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch contribution history for an Ajo
  const historyQuery = useQuery({
    queryKey: ["contributions", ajoId],
    queryFn: async () => {
      if (!user || !ajoId) return [];

      const { data, error } = await supabase
        .from("ledger")
        .select("*")
        .eq("ajo_id", ajoId)
        .eq("type", "contribution")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Contribution[];
    },
    enabled: !!user && !!ajoId,
  });

  // Fetch user's contributions for an Ajo
  const userContributionsQuery = useQuery({
    queryKey: ["user-contributions", ajoId, user?.id],
    queryFn: async () => {
      if (!user || !ajoId) return [];

      const { data, error } = await supabase
        .from("ledger")
        .select("*")
        .eq("ajo_id", ajoId)
        .eq("user_id", user.id)
        .eq("type", "contribution")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Contribution[];
    },
    enabled: !!user && !!ajoId,
  });

  // Charge contribution mutation
  const chargeContributionMutation = useMutation({
    mutationFn: async ({
      membershipId,
      ajoId,
      cardId,
    }: {
      membershipId: string;
      ajoId: string;
      cardId?: string;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("charge-contribution", {
        body: {
          membership_id: membershipId,
          ajo_id: ajoId,
          card_id: cardId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to charge contribution");
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Contribution charged successfully");
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to charge contribution");
    },
  });

  return {
    contributions: historyQuery.data || [],
    userContributions: userContributionsQuery.data || [],
    isLoading: historyQuery.isLoading,
    isLoadingUserContributions: userContributionsQuery.isLoading,
    chargeContribution: chargeContributionMutation.mutateAsync,
    isCharging: chargeContributionMutation.isPending,
  };
}

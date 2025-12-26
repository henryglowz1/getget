import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduledContribution {
  id: string;
  user_id: string;
  ajo_id: string;
  next_debit_date: string | null;
  authorization_code: string | null;
  card_brand: string | null;
  card_last4: string | null;
  is_active: boolean | null;
  retry_count: number | null;
  position: number;
  joined_at: string;
  ajo: {
    id: string;
    name: string;
    contribution_amount: number;
    cycle_type: string;
    status: string;
  } | null;
  profile: {
    full_name: string;
    email: string;
  } | null;
}

export interface FailedPayment {
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
  ajo: {
    id: string;
    name: string;
  } | null;
  profile: {
    full_name: string;
    email: string;
  } | null;
}

export function useAdminContributions() {
  const queryClient = useQueryClient();

  // Fetch scheduled contributions (memberships with next_debit_date)
  const scheduledQuery = useQuery({
    queryKey: ["admin-scheduled-contributions"],
    queryFn: async () => {
      // Fetch memberships with ajo data
      const { data: memberships, error } = await supabase
        .from("memberships")
        .select(`
          *,
          ajo:ajos(id, name, contribution_amount, cycle_type, status)
        `)
        .eq("is_active", true)
        .not("next_debit_date", "is", null)
        .order("next_debit_date", { ascending: true });

      if (error) throw error;
      if (!memberships || memberships.length === 0) return [];

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(memberships.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Combine memberships with profiles
      return memberships.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) || null,
      })) as ScheduledContribution[];
    },
  });

  // Fetch failed payments from ledger
  const failedQuery = useQuery({
    queryKey: ["admin-failed-payments"],
    queryFn: async () => {
      // Fetch ledger entries with ajo data
      const { data: ledgerEntries, error } = await supabase
        .from("ledger")
        .select(`
          *,
          ajo:ajos(id, name)
        `)
        .eq("status", "failed")
        .eq("type", "contribution")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!ledgerEntries || ledgerEntries.length === 0) return [];

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(ledgerEntries.map((l) => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Combine ledger entries with profiles
      return ledgerEntries.map((l) => ({
        ...l,
        profile: profileMap.get(l.user_id) || null,
      })) as FailedPayment[];
    },
  });

  // Retry a failed contribution
  const retryMutation = useMutation({
    mutationFn: async ({
      membershipId,
      ajoId,
    }: {
      membershipId: string;
      ajoId: string;
    }) => {
      const response = await supabase.functions.invoke("charge-contribution", {
        body: {
          membership_id: membershipId,
          ajo_id: ajoId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to retry charge");
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Contribution retry initiated");
      queryClient.invalidateQueries({ queryKey: ["admin-scheduled-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-failed-payments"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to retry contribution");
    },
  });

  // Reset retry count for a membership
  const resetRetryMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("memberships")
        .update({ retry_count: 0 })
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Retry count reset");
      queryClient.invalidateQueries({ queryKey: ["admin-scheduled-contributions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset retry count");
    },
  });

  return {
    scheduledContributions: scheduledQuery.data || [],
    failedPayments: failedQuery.data || [],
    isLoadingScheduled: scheduledQuery.isLoading,
    isLoadingFailed: failedQuery.isLoading,
    retryContribution: retryMutation.mutateAsync,
    isRetrying: retryMutation.isPending,
    resetRetryCount: resetRetryMutation.mutateAsync,
    isResetting: resetRetryMutation.isPending,
  };
}

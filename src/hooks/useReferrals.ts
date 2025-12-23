import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referral_code: string;
  status: string;
  reward_amount: number;
  reward_paid: boolean;
  created_at: string;
  completed_at: string | null;
}

export function useReferrals() {
  const { user } = useAuth();

  const referralsQuery = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!user,
  });

  const referralCodeQuery = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data?.referral_code;
    },
    enabled: !!user,
  });

  const stats = {
    totalReferrals: referralsQuery.data?.length || 0,
    completedReferrals: referralsQuery.data?.filter((r) => r.status === "rewarded").length || 0,
    pendingReferrals: referralsQuery.data?.filter((r) => r.status === "pending").length || 0,
    totalEarnings: referralsQuery.data
      ?.filter((r) => r.reward_paid)
      .reduce((sum, r) => sum + r.reward_amount, 0) || 0,
  };

  return {
    referrals: referralsQuery.data || [],
    referralCode: referralCodeQuery.data,
    stats,
    isLoading: referralsQuery.isLoading || referralCodeQuery.isLoading,
  };
}

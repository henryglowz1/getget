import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  successful_referrals: number;
  total_earnings: number;
}

export function useReferralLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ["referral-leaderboard", limit],
    queryFn: async () => {
      // Get all rewarded referrals with referrer info
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select(`
          referrer_id,
          reward_amount,
          status,
          reward_paid
        `)
        .eq("status", "rewarded")
        .eq("reward_paid", true);

      if (error) throw error;

      // Group by referrer_id and calculate stats
      const referrerStats = new Map<string, { count: number; earnings: number }>();
      
      referrals?.forEach((ref) => {
        const existing = referrerStats.get(ref.referrer_id) || { count: 0, earnings: 0 };
        referrerStats.set(ref.referrer_id, {
          count: existing.count + 1,
          earnings: existing.earnings + (ref.reward_amount || 0),
        });
      });

      // Get user profiles for the referrers
      const referrerIds = Array.from(referrerStats.keys());
      
      if (referrerIds.length === 0) {
        return [] as LeaderboardEntry[];
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", referrerIds);

      if (profilesError) throw profilesError;

      // Combine data and sort by successful referrals
      const leaderboard: LeaderboardEntry[] = (profiles || [])
        .map((profile) => {
          const stats = referrerStats.get(profile.user_id) || { count: 0, earnings: 0 };
          return {
            user_id: profile.user_id,
            full_name: profile.full_name || "Anonymous",
            avatar_url: profile.avatar_url,
            successful_referrals: stats.count,
            total_earnings: stats.earnings,
          };
        })
        .sort((a, b) => b.successful_referrals - a.successful_referrals)
        .slice(0, limit);

      return leaderboard;
    },
  });
}

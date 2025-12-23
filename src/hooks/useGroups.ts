import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AjoGroup {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  cycle_type: string;
  start_date: string;
  max_members: number;
  current_cycle: number | null;
  status: string;
  creator_id: string | null;
  created_at: string;
  memberCount?: number;
  userPosition?: number;
  progress?: number;
}

export function useGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all ajos where user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from("memberships")
        .select("ajo_id, position")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (membershipError) throw membershipError;

      const ajoIds = memberships?.map((m) => m.ajo_id) || [];

      if (ajoIds.length === 0) {
        // Also check for ajos created by user
        const { data: createdAjos, error: createdError } = await supabase
          .from("ajos")
          .select("*")
          .eq("creator_id", user.id);

        if (createdError) throw createdError;
        return createdAjos as AjoGroup[];
      }

      const { data: ajos, error: ajosError } = await supabase
        .from("ajos")
        .select("*")
        .in("id", ajoIds);

      if (ajosError) throw ajosError;

      // Get member counts for each ajo
      const groupsWithCounts = await Promise.all(
        (ajos || []).map(async (ajo) => {
          const { count } = await supabase
            .from("memberships")
            .select("*", { count: "exact", head: true })
            .eq("ajo_id", ajo.id)
            .eq("is_active", true);

          const userMembership = memberships?.find((m) => m.ajo_id === ajo.id);
          const progress = ajo.current_cycle 
            ? Math.round((ajo.current_cycle / ajo.max_members) * 100) 
            : 0;

          return {
            ...ajo,
            memberCount: count || 0,
            userPosition: userMembership?.position,
            progress,
          };
        })
      );

      return groupsWithCounts as AjoGroup[];
    },
    enabled: !!user,
  });
}

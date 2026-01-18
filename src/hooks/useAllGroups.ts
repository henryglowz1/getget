import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AllGroup {
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
  is_public: boolean;
  memberCount: number;
  userPosition?: number;
  progress?: number;
  isMember: boolean;
  hasRequested: boolean;
}

export function useAllGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-groups", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch all public groups and groups user is a member of
      const { data: publicGroups, error: publicError } = await supabase
        .from("ajos")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (publicError) throw publicError;

      // Get user's memberships
      const { data: memberships, error: membershipError } = await supabase
        .from("memberships")
        .select("ajo_id, position")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (membershipError) throw membershipError;

      const userAjoIds = memberships?.map((m) => m.ajo_id) || [];

      // Get private groups user is a member of
      const { data: privateGroups, error: privateError } = await supabase
        .from("ajos")
        .select("*")
        .eq("is_public", false)
        .in("id", userAjoIds);

      if (privateError) throw privateError;

      // Combine and deduplicate
      const allGroups = [...(publicGroups || []), ...(privateGroups || [])];
      const uniqueGroups = allGroups.filter(
        (group, index, self) => index === self.findIndex((g) => g.id === group.id)
      );

      // Get pending join requests
      const { data: pendingRequests, error: requestsError } = await supabase
        .from("join_requests")
        .select("ajo_id")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (requestsError) throw requestsError;

      const requestedGroupIds = pendingRequests?.map((r) => r.ajo_id) || [];

      // Enrich groups with counts and user status
      const groupsWithDetails = await Promise.all(
        uniqueGroups.map(async (group) => {
          const { count } = await supabase
            .from("memberships")
            .select("*", { count: "exact", head: true })
            .eq("ajo_id", group.id)
            .eq("is_active", true);

          const userMembership = memberships?.find((m) => m.ajo_id === group.id);
          const isMember = !!userMembership;
          const hasRequested = requestedGroupIds.includes(group.id);
          const progress = group.current_cycle
            ? Math.round((group.current_cycle / group.max_members) * 100)
            : 0;

          return {
            ...group,
            memberCount: count || 0,
            userPosition: userMembership?.position,
            progress,
            isMember,
            hasRequested,
          } as AllGroup;
        })
      );

      return groupsWithDetails;
    },
    enabled: !!user,
  });
}

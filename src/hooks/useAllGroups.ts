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
  // Creator info
  creatorName: string | null;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
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

      // Get pending join requests (only pending blocks new requests, rejected allows re-requesting)
      const { data: pendingRequests, error: requestsError } = await supabase
        .from("join_requests")
        .select("ajo_id")
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (requestsError) throw requestsError;

      const requestedGroupIds = pendingRequests?.map((r) => r.ajo_id) || [];

      // Get creator IDs for fetching profiles
      const creatorIds = uniqueGroups
        .map((g) => g.creator_id)
        .filter((id): id is string => id !== null);

      // Fetch creator profiles
      const { data: creatorProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .in("user_id", creatorIds);

      const profilesMap = new Map(
        (creatorProfiles || []).map((p) => [p.user_id, p])
      );

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

          const creatorProfile = group.creator_id
            ? profilesMap.get(group.creator_id)
            : null;

          return {
            ...group,
            memberCount: count || 0,
            userPosition: userMembership?.position,
            progress,
            isMember,
            hasRequested,
            creatorName: creatorProfile?.full_name || null,
            creatorUsername: creatorProfile?.username || null,
            creatorAvatarUrl: creatorProfile?.avatar_url || null,
          } as AllGroup;
        })
      );

      return groupsWithDetails;
    },
    enabled: !!user,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendNotification } from "@/lib/notifications";

export interface PublicGroup {
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
  memberCount: number;
  hasRequested: boolean;
  isMember: boolean;
}

export interface JoinRequest {
  id: string;
  ajo_id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function usePublicGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["public-groups", user?.id],
    queryFn: async () => {
      // Fetch public active groups
      const { data: groups, error } = await supabase
        .from("ajos")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts and check user's relationship with each group
      const groupsWithDetails = await Promise.all(
        (groups || []).map(async (group) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from("memberships")
            .select("*", { count: "exact", head: true })
            .eq("ajo_id", group.id)
            .eq("is_active", true);

          // Check if user is already a member
          let isMember = false;
          let hasRequested = false;

          if (user) {
            const { data: membership } = await supabase
              .from("memberships")
              .select("id")
              .eq("ajo_id", group.id)
              .eq("user_id", user.id)
              .eq("is_active", true)
              .maybeSingle();

            isMember = !!membership;

            // Check if user has pending request
            if (!isMember) {
              const { data: request } = await supabase
                .from("join_requests")
                .select("id")
                .eq("ajo_id", group.id)
                .eq("user_id", user.id)
                .eq("status", "pending")
                .maybeSingle();

              hasRequested = !!request;
            }
          }

          return {
            ...group,
            memberCount: memberCount || 0,
            isMember,
            hasRequested,
          } as PublicGroup;
        })
      );

      // Filter out groups user is already a member of
      return groupsWithDetails.filter((g) => !g.isMember);
    },
    enabled: !!user,
  });
}

export function useJoinRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createRequest = useMutation({
    mutationFn: async ({ groupId, message }: { groupId: string; message?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("join_requests")
        .insert({
          ajo_id: groupId,
          user_id: user.id,
          message: message || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-join-requests"] });
    },
  });

  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("join_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-groups"] });
      queryClient.invalidateQueries({ queryKey: ["my-join-requests"] });
    },
  });

  return { createRequest, cancelRequest };
}

export function useGroupJoinRequests(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["group-join-requests", groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from("join_requests")
        .select("*")
        .eq("ajo_id", groupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each requester
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, avatar_url")
            .eq("user_id", request.user_id)
            .single();

          return {
            ...request,
            profile: profile || { full_name: "Unknown", email: "", avatar_url: null },
          } as JoinRequest;
        })
      );

      return requestsWithProfiles;
    },
    enabled: !!groupId && !!user,
  });

  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user || !groupId) throw new Error("Missing data");

      // Get the request details
      const { data: request, error: requestError } = await supabase
        .from("join_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;

      // Get group name for notification
      const { data: group } = await supabase
        .from("ajos")
        .select("name")
        .eq("id", groupId)
        .single();

      // Get current member count to determine position
      const { count } = await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .eq("ajo_id", groupId)
        .eq("is_active", true);

      // Add user to memberships
      const { error: membershipError } = await supabase
        .from("memberships")
        .insert({
          ajo_id: groupId,
          user_id: request.user_id,
          position: (count || 0) + 1,
          is_active: true,
        });

      if (membershipError) throw membershipError;

      // Update request status
      const { error: updateError } = await supabase
        .from("join_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Send notification to the user
      await sendNotification({
        userId: request.user_id,
        type: "group_joined",
        title: "Request Approved! 🎉",
        message: `Your request to join "${group?.name || "the group"}" has been approved. You're now a member!`,
        data: { groupId, groupName: group?.name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-join-requests", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user || !groupId) throw new Error("Not authenticated");

      // Get request details first
      const { data: request } = await supabase
        .from("join_requests")
        .select("user_id")
        .eq("id", requestId)
        .single();

      // Get group name for notification
      const { data: group } = await supabase
        .from("ajos")
        .select("name")
        .eq("id", groupId)
        .single();

      const { error } = await supabase
        .from("join_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", requestId);

      if (error) throw error;

      // Send notification to the user
      if (request) {
        await sendNotification({
          userId: request.user_id,
          type: "join_request",
          title: "Join Request Update",
          message: `Your request to join "${group?.name || "the group"}" was not approved at this time.`,
          data: { groupId, groupName: group?.name },
          sendEmail: false, // Don't send email for rejections
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-join-requests", groupId] });
    },
  });

  return {
    requests: requestsQuery.data || [],
    isLoading: requestsQuery.isLoading,
    approveRequest,
    rejectRequest,
  };
}

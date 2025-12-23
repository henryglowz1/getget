import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GroupMember {
  id: string;
  user_id: string;
  position: number;
  is_active: boolean;
  joined_at: string;
  profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface GroupInvite {
  id: string;
  invitee_email: string;
  invite_code: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export function useGroupDetail(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const groupQuery = useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      if (!groupId) return null;

      const { data, error } = await supabase
        .from("ajos")
        .select("*")
        .eq("id", groupId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!groupId && !!user,
  });

  const membersQuery = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data: memberships, error } = await supabase
        .from("memberships")
        .select("id, user_id, position, is_active, joined_at")
        .eq("ajo_id", groupId)
        .eq("is_active", true)
        .order("position");

      if (error) throw error;

      // Fetch profiles for each member
      const membersWithProfiles = await Promise.all(
        (memberships || []).map(async (member) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, avatar_url")
            .eq("user_id", member.user_id)
            .single();

          return {
            ...member,
            profile: profile || { full_name: "Unknown", email: "", avatar_url: null },
          };
        })
      );

      return membersWithProfiles as GroupMember[];
    },
    enabled: !!groupId && !!user,
  });

  const invitesQuery = useQuery({
    queryKey: ["group-invites", groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from("group_invites")
        .select("*")
        .eq("ajo_id", groupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GroupInvite[];
    },
    enabled: !!groupId && !!user,
  });

  const createInvite = useMutation({
    mutationFn: async (email: string) => {
      if (!groupId || !user) throw new Error("Missing group or user");

      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { data, error } = await supabase
        .from("group_invites")
        .insert({
          ajo_id: groupId,
          inviter_id: user.id,
          invitee_email: email,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-invites", groupId] });
    },
  });

  const deleteInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("group_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-invites", groupId] });
    },
  });

  const isCreator = groupQuery.data?.creator_id === user?.id;
  const isMember = membersQuery.data?.some((m) => m.user_id === user?.id);

  return {
    group: groupQuery.data,
    members: membersQuery.data || [],
    invites: invitesQuery.data || [],
    isLoading: groupQuery.isLoading || membersQuery.isLoading,
    isCreator,
    isMember,
    createInvite,
    deleteInvite,
  };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LinkedBank {
  id: string;
  user_id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  recipient_code: string | null;
  is_default: boolean | null;
  created_at: string;
}

export function useLinkedBanks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["linked_banks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("linked_banks")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      return data as LinkedBank[];
    },
    enabled: !!user,
  });
}

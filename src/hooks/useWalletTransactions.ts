import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
  reference_id: string | null;
}

export function useWalletTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!user,
  });
}

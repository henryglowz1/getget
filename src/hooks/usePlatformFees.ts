import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatformFee {
  id: string;
  ajo_id: string;
  user_id: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  fee_percentage: number;
  cycle: number;
  created_at: string;
  ajos?: {
    name: string;
  };
}

interface FeesByGroup {
  ajo_id: string;
  ajo_name: string;
  total_fees: number;
  total_payouts: number;
  count: number;
}

interface FeesByDate {
  date: string;
  total_fees: number;
  count: number;
}

export function usePlatformFees() {
  const { data: fees, isLoading: isLoadingFees } = useQuery({
    queryKey: ["platform-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_fees")
        .select(`
          *,
          ajos (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PlatformFee[];
    },
  });

  // Calculate total fees collected
  const totalFeesCollected = fees?.reduce((sum, fee) => sum + fee.fee_amount, 0) || 0;
  const totalGrossAmount = fees?.reduce((sum, fee) => sum + fee.gross_amount, 0) || 0;
  const totalPayouts = fees?.length || 0;

  // Group fees by ajo
  const feesByGroup: FeesByGroup[] = fees
    ? Object.values(
        fees.reduce((acc, fee) => {
          const key = fee.ajo_id;
          if (!acc[key]) {
            acc[key] = {
              ajo_id: fee.ajo_id,
              ajo_name: fee.ajos?.name || "Unknown Group",
              total_fees: 0,
              total_payouts: 0,
              count: 0,
            };
          }
          acc[key].total_fees += fee.fee_amount;
          acc[key].total_payouts += fee.net_amount;
          acc[key].count += 1;
          return acc;
        }, {} as Record<string, FeesByGroup>)
      )
    : [];

  // Group fees by date (last 30 days)
  const feesByDate: FeesByDate[] = fees
    ? Object.values(
        fees.reduce((acc, fee) => {
          const date = new Date(fee.created_at).toISOString().split("T")[0];
          if (!acc[date]) {
            acc[date] = {
              date,
              total_fees: 0,
              count: 0,
            };
          }
          acc[date].total_fees += fee.fee_amount;
          acc[date].count += 1;
          return acc;
        }, {} as Record<string, FeesByDate>)
      ).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return {
    fees,
    isLoadingFees,
    totalFeesCollected,
    totalGrossAmount,
    totalPayouts,
    feesByGroup,
    feesByDate,
  };
}

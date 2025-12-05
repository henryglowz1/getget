import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function usePaymentCallback() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (paymentParam === "callback" && reference) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { reference },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.data?.status === "success") {
        toast({
          title: "Payment successful!",
          description: `₦${(data.data.amount / 100).toLocaleString()} has been added to your wallet.`,
        });
        
        // Invalidate wallet query to refresh balance
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
      } else if (data?.data?.status === "failed") {
        toast({
          title: "Payment failed",
          description: "Your payment could not be completed. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment pending",
          description: "Your payment is being processed.",
        });
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      toast({
        title: "Verification failed",
        description: "Could not verify your payment. Please contact support if you were charged.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
      // Clean up URL params
      searchParams.delete("payment");
      searchParams.delete("reference");
      searchParams.delete("trxref");
      setSearchParams(searchParams, { replace: true });
    }
  };

  return { isVerifying };
}

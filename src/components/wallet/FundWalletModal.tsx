import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";

interface FundWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export function FundWalletModal({ open, onOpenChange }: FundWalletModalProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      toast({
        title: "Invalid amount",
        description: "Minimum amount is ₦100",
        variant: "destructive",
      });
      return;
    }

    if (!user || !profile?.email) {
      toast({
        title: "Error",
        description: "Please log in to fund your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert naira to kobo (multiply by 100)
      const amountInKobo = Math.round(numericAmount * 100);
      
      const { data, error } = await supabase.functions.invoke("initialize-payment", {
        body: {
          email: profile.email,
          amount: amountInKobo,
          metadata: {
            type: "wallet_funding",
          },
          callback_url: `${window.location.origin}/dashboard/wallet?payment=callback`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to initialize payment");
      }

      // Redirect to Paystack authorization URL
      window.location.href = data.data.authorization_url;
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "Could not initialize payment. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const formatDisplayAmount = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("en-NG").format(num);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Fund Your Wallet
          </DialogTitle>
          <DialogDescription>
            Add money to your wallet using your debit card
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ₦
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 text-lg font-semibold"
                min="100"
                step="100"
                required
              />
            </div>
            {amount && (
              <p className="text-sm text-muted-foreground">
                ₦{formatDisplayAmount(amount)}
              </p>
            )}
          </div>

          {/* Preset Amounts */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Quick Select</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="text-xs"
                >
                  ₦{new Intl.NumberFormat("en-NG").format(preset)}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pay securely with Paystack</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll be redirected to Paystack to complete your payment securely.
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isLoading || !amount}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {amount ? `Pay ₦${formatDisplayAmount(amount)}` : "Enter Amount"}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

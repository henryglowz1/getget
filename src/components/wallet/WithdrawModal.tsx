import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowUpRight, Building, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLinkedBanks } from "@/hooks/useLinkedBanks";
import { useWallet, formatNaira } from "@/hooks/useWallet";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const { data: linkedBanks, isLoading: banksLoading } = useLinkedBanks();
  const { data: wallet } = useWallet();
  const queryClient = useQueryClient();
  
  const [amount, setAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedBank = linkedBanks?.find(b => b.id === selectedBankId);
  const walletBalanceNaira = wallet ? wallet.balance / 100 : 0;

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      toast({
        title: "Invalid amount",
        description: "Minimum withdrawal is ₦100",
        variant: "destructive",
      });
      return;
    }

    if (numericAmount > walletBalanceNaira) {
      toast({
        title: "Insufficient balance",
        description: `Your wallet balance is ${formatNaira(wallet?.balance || 0)}`,
        variant: "destructive",
      });
      return;
    }

    if (!selectedBank?.recipient_code) {
      toast({
        title: "Invalid bank account",
        description: "This bank account is not properly configured for withdrawals",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const amountInKobo = Math.round(numericAmount * 100);

      const { data, error } = await supabase.functions.invoke("initiate-transfer", {
        body: {
          amount: amountInKobo,
          recipient_code: selectedBank.recipient_code,
          reason: "Wallet withdrawal",
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || "Withdrawal failed");
      }

      toast({
        title: "Withdrawal initiated",
        description: `₦${formatDisplayAmount(amount)} is being transferred to ${selectedBank.bank_name}`,
      });

      // Invalidate wallet query to refresh balance
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      
      // Reset form and close modal
      setAmount("");
      setSelectedBankId("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Withdrawal failed",
        description: error.message || "Could not process withdrawal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDisplayAmount = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("en-NG").format(num);
  };

  const hasLinkedBanks = linkedBanks && linkedBanks.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-primary" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Transfer money from your wallet to your bank account
          </DialogDescription>
        </DialogHeader>

        {banksLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasLinkedBanks ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Building className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">No bank account linked</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add a bank account in Settings to withdraw funds
              </p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Available Balance */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold">{formatNaira(wallet?.balance || 0)}</p>
            </div>

            {/* Bank Selection */}
            <div className="space-y-2">
              <Label htmlFor="bank">Select Bank Account</Label>
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose bank account" />
                </SelectTrigger>
                <SelectContent>
                  {linkedBanks?.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      <div className="flex flex-col">
                        <span>{bank.bank_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {bank.account_number} - {bank.account_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  max={walletBalanceNaira}
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
                {PRESET_AMOUNTS.filter(p => p <= walletBalanceNaira).map((preset) => (
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

            {/* Warning */}
            {selectedBank && !selectedBank.recipient_code && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>This bank account is not set up for withdrawals. Please add a new bank account.</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !amount || !selectedBankId || !selectedBank?.recipient_code}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  {amount ? `Withdraw ₦${formatDisplayAmount(amount)}` : "Enter Amount"}
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

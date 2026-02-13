import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, User, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { formatNaira } from "@/hooks/useWallet";

interface SendFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export function SendFundsModal({ open, onOpenChange }: SendFundsModalProps) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ name: string; username: string; amount: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      toast({ title: "Invalid amount", description: "Minimum transfer is ₦100", variant: "destructive" });
      return;
    }
    if (!username.trim()) {
      toast({ title: "Username required", description: "Enter the recipient's username", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const amountInKobo = Math.round(numericAmount * 100);
      const { data, error } = await supabase.functions.invoke("transfer-to-user", {
        body: { username: username.trim(), amount: amountInKobo },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Transfer failed");

      setSuccess({
        name: data.data.recipient_name,
        username: data.data.recipient_username,
        amount: amountInKobo,
      });

      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });

      toast({ title: "Transfer successful!", description: `Sent ${formatNaira(amountInKobo)} to @${data.data.recipient_username}` });
    } catch (error: any) {
      toast({ title: "Transfer failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setUsername("");
      setAmount("");
      setSuccess(null);
    }
    onOpenChange(open);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-display text-xl font-bold">Transfer Successful!</h3>
            <p className="text-muted-foreground">
              You sent <span className="font-semibold text-foreground">{formatNaira(success.amount)}</span> to{" "}
              <span className="font-semibold text-foreground">@{success.username}</span>
            </p>
            <p className="text-sm text-muted-foreground">{success.name}</p>
            <Button onClick={() => handleClose(false)} className="mt-4">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Send Funds
          </DialogTitle>
          <DialogDescription>
            Transfer money instantly to another user by their username
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="recipient"
                placeholder="e.g. johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="send-amount">Amount (₦)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
              <Input
                id="send-amount"
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
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Quick Select</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === preset.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className="text-xs"
                >
                  ₦{new Intl.NumberFormat("en-NG").format(preset)}
                </Button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading || !amount || !username}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> {amount ? `Send ₦${new Intl.NumberFormat("en-NG").format(parseFloat(amount) || 0)}` : "Enter Amount"}</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

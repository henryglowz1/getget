import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Smartphone, Wifi, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { formatNaira } from "@/hooks/useWallet";

interface BillPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "airtel", label: "Airtel" },
  { value: "glo", label: "Glo" },
  { value: "9mobile", label: "9mobile" },
];

const AIRTIME_PRESETS = [100, 200, 500, 1000, 2000, 5000];

const DATA_PLANS = [
  { value: "500", label: "500MB - ₦500", amount: 500 },
  { value: "1000", label: "1GB - ₦1,000", amount: 1000 },
  { value: "2000", label: "2GB - ₦2,000", amount: 2000 },
  { value: "3000", label: "3GB - ₦3,000", amount: 3000 },
  { value: "5000", label: "5GB - ₦5,000", amount: 5000 },
  { value: "10000", label: "10GB - ₦10,000", amount: 10000 },
];

export function BillPaymentModal({ open, onOpenChange }: BillPaymentModalProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"airtime" | "data">("airtime");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [dataPlan, setDataPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!network) {
      toast({ title: "Select network", description: "Please choose a network provider", variant: "destructive" });
      return;
    }
    if (!phone || phone.length < 10) {
      toast({ title: "Invalid phone", description: "Enter a valid phone number", variant: "destructive" });
      return;
    }

    let amountInKobo: number;
    if (tab === "airtime") {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 50) {
        toast({ title: "Invalid amount", description: "Minimum airtime is ₦50", variant: "destructive" });
        return;
      }
      amountInKobo = Math.round(numericAmount * 100);
    } else {
      const selectedPlan = DATA_PLANS.find(p => p.value === dataPlan);
      if (!selectedPlan) {
        toast({ title: "Select a plan", description: "Please choose a data plan", variant: "destructive" });
        return;
      }
      amountInKobo = selectedPlan.amount * 100;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pay-bill", {
        body: {
          type: tab,
          network,
          phone: phone.trim(),
          amount: amountInKobo,
          ...(tab === "data" ? { plan_code: dataPlan } : {}),
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Payment failed");

      setSuccess(data.message);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });

      toast({ title: "Payment successful!", description: data.message });
    } catch (error: any) {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setNetwork("");
      setPhone("");
      setAmount("");
      setDataPlan("");
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
            <h3 className="font-display text-xl font-bold">Payment Successful!</h3>
            <p className="text-muted-foreground">{success}</p>
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
            <Smartphone className="w-5 h-5 text-primary" />
            Bills & Utilities
          </DialogTitle>
          <DialogDescription>
            Buy airtime or data bundles directly from your wallet
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "airtime" | "data")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="airtime" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Airtime
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Wifi className="w-4 h-4" /> Data
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Network Selection */}
            <div className="space-y-2">
              <Label>Network Provider</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="bill-phone">Phone Number</Label>
              <Input
                id="bill-phone"
                type="tel"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                required
              />
            </div>

            <TabsContent value="airtime" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="airtime-amount">Amount (₦)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
                  <Input
                    id="airtime-amount"
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 text-lg font-semibold"
                    min="50"
                    step="50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {AIRTIME_PRESETS.map((preset) => (
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
            </TabsContent>

            <TabsContent value="data" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Data Plan</Label>
                <Select value={dataPlan} onValueChange={setDataPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a data plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_PLANS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading || !network || !phone}>
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Smartphone className="w-4 h-4 mr-2" /> 
                  {tab === "airtime" && amount
                    ? `Buy ₦${new Intl.NumberFormat("en-NG").format(parseFloat(amount) || 0)} Airtime`
                    : tab === "data" && dataPlan
                      ? `Buy ${DATA_PLANS.find(p => p.value === dataPlan)?.label.split(' - ')[0]} Data`
                      : "Select Amount"}
                </>
              )}
            </Button>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

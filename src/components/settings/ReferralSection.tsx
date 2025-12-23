import { useReferrals } from "@/hooks/useReferrals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Gift, 
  Copy, 
  Users, 
  CheckCircle2, 
  Clock, 
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ReferralSection() {
  const { referralCode, stats, isLoading } = useReferrals();
  const { toast } = useToast();

  const referralLink = referralCode 
    ? `${window.location.origin}/register?ref=${referralCode}` 
    : "";

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Referral link copied!",
      description: "Share this link with friends to earn ₦200 per referral.",
    });
  };

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast({
        title: "Referral code copied!",
        description: "Share this code with friends.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-soft p-6">
      <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        Referral Program
      </h2>

      <p className="text-sm text-muted-foreground mb-4">
        Earn <span className="font-semibold text-success">₦200</span> for every friend you refer who funds their wallet!
      </p>

      {/* Referral Code */}
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Your Referral Code</label>
          <div className="flex gap-2">
            <Input
              value={referralCode || ""}
              readOnly
              className="font-mono text-lg tracking-wider text-center"
            />
            <Button variant="outline" onClick={copyReferralCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="text-sm"
            />
            <Button variant="outline" onClick={copyReferralLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-success">
            ₦{(stats.totalEarnings / 100).toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.completedReferrals}</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.pendingReferrals}</p>
        </div>
      </div>
    </div>
  );
}

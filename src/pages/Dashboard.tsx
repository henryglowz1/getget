import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ChevronRight,
  Calendar
} from "lucide-react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useWallet, formatNaira } from "@/hooks/useWallet";
import { useUsernameRequired } from "@/hooks/useUsernameRequired";
import { UsernameSetupModal } from "@/components/settings/UsernameSetupModal";

export default function Dashboard() {
  const { profile } = useProfile();
  const { data: wallet } = useWallet();
  const { needsUsername, refetch: refetchUsername } = useUsernameRequired();

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const walletBalance = wallet?.balance || 0;

  const stats: Array<{
    label: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: typeof Wallet;
  }> = [
    {
      label: "Wallet Balance",
      value: formatNaira(walletBalance),
      change: "Available",
      changeType: "positive",
      icon: Wallet
    },
    {
      label: "Total Contributed",
      value: "₦0",
      change: "No contributions yet",
      changeType: "neutral",
      icon: TrendingUp
    },
    {
      label: "Active Groups",
      value: "0",
      change: "Join a group",
      changeType: "neutral",
      icon: Users
    },
    {
      label: "Linked Cards",
      value: "0",
      change: "Link a card",
      changeType: "neutral",
      icon: CreditCard
    }
  ];

  return (
    <DashboardLayout>
      {/* Username Setup Modal */}
      <UsernameSetupModal open={needsUsername} onComplete={refetchUsername} />
      
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-primary rounded-2xl p-6 lg:p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h1 className="font-display text-2xl lg:text-3xl font-bold mb-2">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-primary-foreground/80 mb-4">
              Start by creating or joining an Ajo group
            </p>
            <Button variant="gold" asChild>
              <Link to="/dashboard/groups">
                View Groups
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border/50 p-4 lg:p-6 shadow-soft hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  stat.changeType === "positive" 
                    ? "bg-success/10 text-success" 
                    : stat.changeType === "negative"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-card rounded-xl border border-border/50 shadow-soft">
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border/50">
              <h2 className="font-display text-lg font-semibold">Recent Transactions</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/transactions">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="p-6 text-center text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Your contribution history will appear here</p>
            </div>
          </div>

          {/* Active Groups */}
          <div className="bg-card rounded-xl border border-border/50 shadow-soft">
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border/50">
              <h2 className="font-display text-lg font-semibold">Active Groups</h2>
              <Button variant="hero" size="sm" asChild>
                <Link to="/dashboard/groups/create">
                  <Plus className="w-4 h-4 mr-1" />
                  New Group
                </Link>
              </Button>
            </div>
            <div className="p-6 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No active groups</p>
              <p className="text-xs mt-1">Create or join an Ajo group to get started</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/dashboard/groups">
                  Browse Groups
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function History(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

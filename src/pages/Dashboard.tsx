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

const stats = [
  {
    label: "Wallet Balance",
    value: "₦125,000",
    change: "+₦25,000",
    changeType: "positive",
    icon: Wallet
  },
  {
    label: "Total Contributed",
    value: "₦450,000",
    change: "+15%",
    changeType: "positive",
    icon: TrendingUp
  },
  {
    label: "Active Groups",
    value: "3",
    change: "1 pending",
    changeType: "neutral",
    icon: Users
  },
  {
    label: "Linked Cards",
    value: "2",
    change: "Active",
    changeType: "positive",
    icon: CreditCard
  }
];

const recentTransactions = [
  { id: 1, type: "debit", description: "Monthly Ajo - Friends Circle", amount: "₦10,000", date: "Today, 9:30 AM", status: "success" },
  { id: 2, type: "credit", description: "Payout - Family Savings", amount: "₦60,000", date: "Yesterday", status: "success" },
  { id: 3, type: "debit", description: "Weekly Ajo - Office Group", amount: "₦5,000", date: "Nov 27, 2024", status: "success" },
  { id: 4, type: "debit", description: "Monthly Ajo - Friends Circle", amount: "₦10,000", date: "Nov 25, 2024", status: "failed" },
];

const activeGroups = [
  { id: 1, name: "Friends Circle", members: 10, contribution: "₦10,000", cycle: "Monthly", nextPayout: "Dec 15, 2024", position: 3 },
  { id: 2, name: "Family Savings", members: 5, contribution: "₦20,000", cycle: "Monthly", nextPayout: "Jan 1, 2025", position: 2 },
  { id: 3, name: "Office Group", members: 8, contribution: "₦5,000", cycle: "Weekly", nextPayout: "Dec 2, 2024", position: 5 },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-primary rounded-2xl p-6 lg:p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h1 className="font-display text-2xl lg:text-3xl font-bold mb-2">
              Welcome back, John! 👋
            </h1>
            <p className="text-primary-foreground/80 mb-4">
              Your next contribution is scheduled for December 1st, 2024
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
            <div className="divide-y divide-border/50">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-4 lg:px-6 hover:bg-muted/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === "credit" 
                      ? "bg-success/10" 
                      : tx.status === "failed" 
                      ? "bg-destructive/10" 
                      : "bg-muted"
                  }`}>
                    {tx.type === "credit" ? (
                      <ArrowDownRight className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowUpRight className={`w-5 h-5 ${tx.status === "failed" ? "text-destructive" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      tx.type === "credit" ? "text-success" : "text-foreground"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"}{tx.amount}
                    </p>
                    {tx.status === "failed" && (
                      <p className="text-xs text-destructive">Failed</p>
                    )}
                  </div>
                </div>
              ))}
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
            <div className="divide-y divide-border/50">
              {activeGroups.map((group) => (
                <Link 
                  key={group.id} 
                  to={`/dashboard/groups/${group.id}`}
                  className="flex items-center gap-4 p-4 lg:px-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {group.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.members} members • {group.cycle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{group.contribution}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Position {group.position}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

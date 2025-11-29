import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Building2,
  Plus,
  Send
} from "lucide-react";
import { useState } from "react";

const walletHistory = [
  { id: 1, type: "credit", description: "Payout - Family Savings", amount: "₦60,000", date: "Nov 28, 2024", balance: "₦125,000" },
  { id: 2, type: "debit", description: "Withdrawal to GTBank", amount: "₦50,000", date: "Nov 25, 2024", balance: "₦65,000" },
  { id: 3, type: "credit", description: "Payout - Friends Circle", amount: "₦100,000", date: "Nov 15, 2024", balance: "₦115,000" },
  { id: 4, type: "debit", description: "Withdrawal to Access Bank", amount: "₦30,000", date: "Nov 10, 2024", balance: "₦15,000" },
  { id: 5, type: "credit", description: "Payout - Office Group", amount: "₦40,000", date: "Nov 5, 2024", balance: "₦45,000" },
];

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"all" | "credits" | "debits">("all");

  const filteredHistory = walletHistory.filter(tx => {
    if (activeTab === "all") return true;
    if (activeTab === "credits") return tx.type === "credit";
    return tx.type === "debit";
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Wallet Card */}
        <div className="bg-gradient-primary rounded-2xl p-6 lg:p-8 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-6 h-6" />
              <span className="text-primary-foreground/80">Available Balance</span>
            </div>
            <p className="font-display text-4xl lg:text-5xl font-bold mb-6">₦125,000</p>
            
            <div className="flex flex-wrap gap-3">
              <Button variant="gold">
                <Send className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
              <Button 
                variant="outline" 
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Bank
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 text-success mb-2">
              <ArrowDownRight className="w-5 h-5" />
              <span className="text-sm font-medium">Total Received</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">₦250,000</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-sm font-medium">Total Withdrawn</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">₦125,000</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">₦60,000</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">Linked Banks</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">2</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-card rounded-xl border border-border/50 shadow-soft">
          <div className="p-4 lg:p-6 border-b border-border/50">
            <h2 className="font-display text-lg font-semibold mb-4">Wallet History</h2>
            <div className="flex gap-2">
              {(["all", "credits", "debits"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border/50">
            {filteredHistory.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-4 lg:px-6 hover:bg-muted/50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === "credit" ? "bg-success/10" : "bg-muted"
                }`}>
                  {tx.type === "credit" ? (
                    <ArrowDownRight className="w-5 h-5 text-success" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
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
                  <p className="text-xs text-muted-foreground">Bal: {tx.balance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

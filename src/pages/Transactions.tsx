import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useState } from "react";

const transactions = [
  { id: 1, type: "debit", description: "Monthly Ajo - Friends Circle", amount: "₦10,000", date: "Nov 29, 2024", time: "9:30 AM", status: "success", reference: "TXN_001234" },
  { id: 2, type: "credit", description: "Payout - Family Savings", amount: "₦60,000", date: "Nov 28, 2024", time: "2:15 PM", status: "success", reference: "TXN_001233" },
  { id: 3, type: "debit", description: "Weekly Ajo - Office Group", amount: "₦5,000", date: "Nov 27, 2024", time: "10:00 AM", status: "success", reference: "TXN_001232" },
  { id: 4, type: "debit", description: "Monthly Ajo - Friends Circle", amount: "₦10,000", date: "Nov 25, 2024", time: "9:30 AM", status: "failed", reference: "TXN_001231" },
  { id: 5, type: "debit", description: "Monthly Ajo - Friends Circle", amount: "₦10,000", date: "Nov 25, 2024", time: "11:45 AM", status: "success", reference: "TXN_001230" },
  { id: 6, type: "credit", description: "Payout - Office Group", amount: "₦40,000", date: "Nov 20, 2024", time: "3:00 PM", status: "success", reference: "TXN_001229" },
  { id: 7, type: "debit", description: "Weekly Ajo - Office Group", amount: "₦5,000", date: "Nov 20, 2024", time: "10:00 AM", status: "pending", reference: "TXN_001228" },
];

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "debit" | "credit">("all");

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || tx.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "pending":
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success/10 text-success";
      case "failed":
        return "bg-destructive/10 text-destructive";
      case "pending":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">View all your contributions and payouts</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "debit", "credit"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {type === "all" ? "All" : type === "debit" ? "Debits" : "Credits"}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Transaction</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Date</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Reference</th>
                  <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          tx.type === "credit" ? "bg-success/10" : "bg-muted"
                        }`}>
                          {tx.type === "credit" ? (
                            <ArrowDownRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-foreground">{tx.date}</p>
                        <p className="text-xs text-muted-foreground">{tx.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(tx.status)}`}>
                        {getStatusIcon(tx.status)}
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground font-mono">{tx.reference}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-semibold ${
                        tx.type === "credit" ? "text-success" : "text-foreground"
                      }`}>
                        {tx.type === "credit" ? "+" : "-"}{tx.amount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-border/50">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === "credit" ? "bg-success/10" : "bg-muted"
                    }`}>
                      {tx.type === "credit" ? (
                        <ArrowDownRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
                      tx.type === "credit" ? "text-success" : "text-foreground"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"}{tx.amount}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(tx.status)}`}>
                    {getStatusIcon(tx.status)}
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-1">{tx.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{tx.date} • {tx.time}</span>
                  <span className="font-mono">{tx.reference}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

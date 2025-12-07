import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Download,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";
import { format } from "date-fns";

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount / 100);
};

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "debit" | "credit">("all");
  const { data: transactions = [], isLoading } = useWalletTransactions();

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = (tx.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tx.reference_id || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || tx.type === filterType;
    return matchesSearch && matchesFilter;
  });

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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/50">
                      <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Transaction</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Date</th>
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
                            <span className="text-sm font-medium text-foreground">
                              {tx.description || (tx.type === "credit" ? "Wallet Funding" : "Withdrawal")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-foreground">{format(new Date(tx.created_at), "MMM d, yyyy")}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), "h:mm a")}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground font-mono">
                            {tx.reference_id ? tx.reference_id.slice(0, 12) : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-semibold ${
                            tx.type === "credit" ? "text-success" : "text-foreground"
                          }`}>
                            {tx.type === "credit" ? "+" : "-"}{formatNaira(tx.amount)}
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
                          {tx.type === "credit" ? "+" : "-"}{formatNaira(tx.amount)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground mb-1">
                      {tx.description || (tx.type === "credit" ? "Wallet Funding" : "Withdrawal")}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(tx.created_at), "MMM d, yyyy")} • {format(new Date(tx.created_at), "h:mm a")}</span>
                      <span className="font-mono">{tx.reference_id ? tx.reference_id.slice(0, 12) : "—"}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

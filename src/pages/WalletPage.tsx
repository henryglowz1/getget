import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Building2,
  Plus,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  X,
  Search
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useWallet, formatNaira } from "@/hooks/useWallet";
import { FundWalletModal } from "@/components/wallet/FundWalletModal";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { LinkedBanksManager } from "@/components/wallet/LinkedBanksManager";
import { AddBankModal } from "@/components/wallet/AddBankModal";
import { useLinkedBanks } from "@/hooks/useLinkedBanks";
import { useWalletTransactions, WalletTransaction } from "@/hooks/useWalletTransactions";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SpendingTrendChart } from "@/components/wallet/SpendingTrendChart";

const ITEMS_PER_PAGE = 5;

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"all" | "credits" | "debits">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [addBankModalOpen, setAddBankModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { isVerifying } = usePaymentCallback();
  const { data: linkedBanks } = useLinkedBanks();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();

  const filteredHistory = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      // Filter by tab
      if (activeTab === "credits" && tx.type !== "credit") return false;
      if (activeTab === "debits" && tx.type !== "debit") return false;
      
      // Filter by date range
      if (dateRange.from || dateRange.to) {
        const txDate = new Date(tx.created_at);
        const from = dateRange.from ? startOfDay(dateRange.from) : new Date(0);
        const to = dateRange.to ? endOfDay(dateRange.to) : new Date();
        if (!isWithinInterval(txDate, { start: from, end: to })) return false;
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const description = (tx.description || "").toLowerCase();
        const refId = (tx.reference_id || "").toLowerCase();
        if (!description.includes(query) && !refId.includes(query)) return false;
      }
      
      return true;
    });
  }, [transactions, activeTab, dateRange, searchQuery]);

  // Reset to page 1 when tab or date range changes
  const handleTabChange = (tab: "all" | "credits" | "debits") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (!filteredHistory.length) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["Date", "Type", "Description", "Amount (₦)"];
    const rows = filteredHistory.map(tx => [
      format(new Date(tx.created_at), "yyyy-MM-dd HH:mm:ss"),
      tx.type === "credit" ? "Credit" : "Debit",
      tx.description || (tx.type === "credit" ? "Wallet Funding" : "Withdrawal"),
      tx.type === "credit" ? tx.amount.toString() : `-${tx.amount}`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `wallet-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Transactions exported successfully");
  }, [filteredHistory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const stats = useMemo(() => {
    if (!transactions) return { totalReceived: 0, totalWithdrawn: 0, thisMonth: 0 };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalReceived = transactions
      .filter(tx => tx.type === "credit")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalWithdrawn = transactions
      .filter(tx => tx.type === "debit")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const thisMonth = transactions
      .filter(tx => {
        const txDate = new Date(tx.created_at);
        return tx.type === "credit" && 
               txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { totalReceived, totalWithdrawn, thisMonth };
  }, [transactions]);

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
            <p className="font-display text-4xl lg:text-5xl font-bold mb-6">
              {walletLoading || isVerifying ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                formatNaira(wallet?.balance ?? 0)
              )}
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button variant="gold" onClick={() => setFundModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Fund Wallet
              </Button>
              <Button variant="gold" onClick={() => setWithdrawModalOpen(true)}>
                <Send className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
              <Button 
                variant="outline" 
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setAddBankModalOpen(true)}
              >
                <Building2 className="w-4 h-4 mr-2" />
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
            <p className="font-display text-xl font-bold text-foreground">
              {txLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : formatNaira(stats.totalReceived)}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-sm font-medium">Total Withdrawn</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              {txLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : formatNaira(stats.totalWithdrawn)}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 text-primary mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">
              {txLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : formatNaira(stats.thisMonth)}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">Linked Banks</span>
            </div>
            <p className="font-display text-xl font-bold text-foreground">{linkedBanks?.length ?? 0}</p>
          </div>
        </div>

        {/* Spending Trend Chart */}
        <div className="bg-card rounded-xl border border-border/50 shadow-soft p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Spending Trends</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">Debits</span>
              </div>
            </div>
          </div>
          {txLoading ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <SpendingTrendChart transactions={transactions} days={30} />
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
              <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No data to display yet</p>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-card rounded-xl border border-border/50 shadow-soft">
          <div className="p-4 lg:p-6 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="font-display text-lg font-semibold">Wallet History</h2>
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9 h-9 w-[180px] text-sm"
                  />
                </div>

                {/* Date Range Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        (dateRange.from || dateRange.to) && "text-foreground"
                      )}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        <span>Filter by date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => handleDateRangeChange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Clear Date Filter */}
                {(dateRange.from || dateRange.to) && (
                  <Button variant="ghost" size="sm" onClick={clearDateRange}>
                    <X className="w-4 h-4" />
                  </Button>
                )}

                {/* Export Button */}
                <Button variant="outline" size="sm" onClick={exportToCSV} disabled={txLoading || !filteredHistory.length}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              {(["all", "credits", "debits"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
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
            {txLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              paginatedHistory.map((tx) => (
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
                    <p className="text-sm font-medium text-foreground truncate">
                      {tx.description || (tx.type === "credit" ? "Wallet Funding" : "Withdrawal")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      tx.type === "credit" ? "text-success" : "text-foreground"
                    }`}>
                      {tx.type === "credit" ? "+" : "-"}{formatNaira(tx.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!txLoading && filteredHistory.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between p-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Linked Banks */}
        <LinkedBanksManager />
      </div>

      <FundWalletModal open={fundModalOpen} onOpenChange={setFundModalOpen} />
      <WithdrawModal open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen} />
      <AddBankModal open={addBankModalOpen} onOpenChange={setAddBankModalOpen} />
    </DashboardLayout>
  );
}

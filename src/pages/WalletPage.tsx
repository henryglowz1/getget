import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
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
  ChevronRight
} from "lucide-react";
import { useState, useMemo } from "react";
import { useWallet, formatNaira } from "@/hooks/useWallet";
import { FundWalletModal } from "@/components/wallet/FundWalletModal";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { LinkedBanksManager } from "@/components/wallet/LinkedBanksManager";
import { AddBankModal } from "@/components/wallet/AddBankModal";
import { useLinkedBanks } from "@/hooks/useLinkedBanks";
import { useWalletTransactions } from "@/hooks/useWalletTransactions";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 5;

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"all" | "credits" | "debits">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [addBankModalOpen, setAddBankModalOpen] = useState(false);
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { isVerifying } = usePaymentCallback();
  const { data: linkedBanks } = useLinkedBanks();
  const { data: transactions, isLoading: txLoading } = useWalletTransactions();

  const filteredHistory = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(tx => {
      if (activeTab === "all") return true;
      if (activeTab === "credits") return tx.type === "credit";
      return tx.type === "debit";
    });
  }, [transactions, activeTab]);

  // Reset to page 1 when tab changes
  const handleTabChange = (tab: "all" | "credits" | "debits") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

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

        {/* Transaction History */}
        <div className="bg-card rounded-xl border border-border/50 shadow-soft">
          <div className="p-4 lg:p-6 border-b border-border/50">
            <h2 className="font-display text-lg font-semibold mb-4">Wallet History</h2>
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

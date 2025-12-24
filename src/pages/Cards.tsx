import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Plus, 
  Shield, 
  Trash2,
  CheckCircle2,
  RotateCcw,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserCards } from "@/hooks/useUserCards";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Cards() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    cards, 
    isLoading, 
    setDefault, 
    removeCard, 
    resetCards,
    isSettingDefault,
    isRemoving,
    isResetting
  } = useUserCards();
  const [isLinking, setIsLinking] = useState(false);
  const [removingCardId, setRemovingCardId] = useState<string | null>(null);
  
  // Handle payment callback when returning from Paystack
  const { isVerifying } = usePaymentCallback();

  const handleLinkCard = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to link a card.",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("link-card", {
        body: {
          callback_url: `${window.location.origin}/dashboard/cards?payment=callback`,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Failed to initialize card linking");
      }

      // Redirect to Paystack
      window.location.href = data.data.authorization_url;
    } catch (error: any) {
      console.error("Card linking error:", error);
      toast({
        title: "Card linking failed",
        description: error.message || "Could not initialize card linking. Please try again.",
        variant: "destructive",
      });
      setIsLinking(false);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      await setDefault(cardId);
      toast({
        title: "Default card updated",
        description: "Your default payment card has been changed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update default",
        description: error.message || "Could not update default card.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    setRemovingCardId(cardId);
    try {
      await removeCard(cardId);
      toast({
        title: "Card removed",
        description: "The card has been removed from your account.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to remove card",
        description: error.message || "Could not remove card.",
        variant: "destructive",
      });
    } finally {
      setRemovingCardId(null);
    }
  };

  const handleResetCards = async () => {
    try {
      await resetCards();
      toast({
        title: "All cards removed",
        description: "All linked cards have been removed from your account.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to reset cards",
        description: error.message || "Could not reset cards.",
        variant: "destructive",
      });
    }
  };

  const getCardGradient = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes("mastercard") || brandLower.includes("master")) {
      return "bg-gradient-to-br from-red-500 to-yellow-500";
    } else if (brandLower.includes("visa")) {
      return "bg-gradient-to-br from-blue-600 to-blue-400";
    } else if (brandLower.includes("verve")) {
      return "bg-gradient-to-br from-green-600 to-green-400";
    }
    return "bg-gradient-to-br from-gray-600 to-gray-400";
  };

  const formatExpiry = (month: string | null, year: string | null) => {
    if (!month || !year) return "";
    return `${month.padStart(2, '0')}/${year.slice(-2)}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Payment Cards</h1>
            <p className="text-muted-foreground">Manage cards for automatic contributions</p>
          </div>
          <div className="flex gap-2">
            {cards.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isResetting}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all cards?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all linked cards from your account. You'll need to link new cards for automatic contributions.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetCards}>
                      Reset All Cards
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="hero" onClick={handleLinkCard} disabled={isLinking}>
              {isLinking ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isLinking ? "Linking..." : "Link New Card"}
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Bank-Grade Security</p>
            <p className="text-sm text-muted-foreground">
              We use Paystack's secure tokenization. Your actual card details are never stored on our servers.
              Only encrypted authorization tokens are used for automatic debits.
            </p>
          </div>
        </div>

        {/* Cards List */}
        {cards.length > 0 && (
          <div className="grid gap-4">
            {cards.map((card) => (
              <div 
                key={card.id}
                className="bg-card rounded-xl border border-border/50 p-5 lg:p-6 shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Card Visual */}
                    <div className={`w-16 h-11 rounded-lg flex items-center justify-center ${getCardGradient(card.card_brand)}`}>
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {card.card_brand} •••• {card.card_last4}
                        </p>
                        {card.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      {(card.exp_month && card.exp_year) && (
                        <p className="text-sm text-muted-foreground">
                          Expires {formatExpiry(card.exp_month, card.exp_year)}
                        </p>
                      )}
                      {card.bank_name && (
                        <p className="text-xs text-muted-foreground">{card.bank_name}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        <span className="text-xs text-success">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!card.is_default && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                        disabled={isSettingDefault}
                      >
                        Set Default
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={removingCardId === card.id}
                        >
                          {removingCardId === card.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove this card?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the {card.card_brand} card ending in {card.card_last4} from your account.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveCard(card.id)}>
                            Remove Card
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {cards.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No cards linked</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Link a debit card to enable automatic contributions to your Ajo groups.
            </p>
            <Button variant="hero" onClick={handleLinkCard} disabled={isLinking}>
              {isLinking ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {isLinking ? "Linking..." : "Link Your First Card"}
            </Button>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-muted/50 rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">How Card Linking Works</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Verify with ₦100</p>
                <p className="text-sm text-muted-foreground">A small test charge verifies your card</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Secure Token Created</p>
                <p className="text-sm text-muted-foreground">Paystack stores an encrypted token</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Auto-Debit Enabled</p>
                <p className="text-sm text-muted-foreground">Contributions are charged automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

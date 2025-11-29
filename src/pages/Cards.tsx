import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Plus, 
  Shield, 
  Trash2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const linkedCards = [
  { 
    id: 1, 
    brand: "Mastercard", 
    last4: "4532", 
    expiry: "12/26", 
    isDefault: true,
    status: "active"
  },
  { 
    id: 2, 
    brand: "Visa", 
    last4: "8901", 
    expiry: "08/25", 
    isDefault: false,
    status: "active"
  }
];

export default function Cards() {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkCard = () => {
    setIsLinking(true);
    // Simulate Paystack inline popup
    setTimeout(() => {
      setIsLinking(false);
      toast({
        title: "Card linked successfully!",
        description: "Your card has been securely added for automatic debits.",
      });
    }, 2000);
  };

  const handleSetDefault = (cardId: number) => {
    toast({
      title: "Default card updated",
      description: "Your default payment card has been changed.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Payment Cards</h1>
            <p className="text-muted-foreground">Manage cards for automatic contributions</p>
          </div>
          <Button variant="hero" onClick={handleLinkCard} disabled={isLinking}>
            <Plus className="w-4 h-4 mr-2" />
            {isLinking ? "Linking..." : "Link New Card"}
          </Button>
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
        <div className="grid gap-4">
          {linkedCards.map((card) => (
            <div 
              key={card.id}
              className="bg-card rounded-xl border border-border/50 p-5 lg:p-6 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Card Visual */}
                  <div className={`w-16 h-11 rounded-lg flex items-center justify-center ${
                    card.brand === "Mastercard" 
                      ? "bg-gradient-to-br from-red-500 to-yellow-500" 
                      : "bg-gradient-to-br from-blue-600 to-blue-400"
                  }`}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {card.brand} •••• {card.last4}
                      </p>
                      {card.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span className="text-xs text-success">Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!card.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSetDefault(card.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {linkedCards.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border border-border/50">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No cards linked</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Link a debit card to enable automatic contributions to your Ajo groups.
            </p>
            <Button variant="hero" onClick={handleLinkCard}>
              <Plus className="w-4 h-4 mr-2" />
              Link Your First Card
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

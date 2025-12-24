import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserCards } from "@/hooks/useUserCards";
import { useContributions } from "@/hooks/useContributions";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayContributionModalProps {
  membershipId: string;
  ajoId: string;
  contributionAmount: number;
  cycleName: string;
}

export function PayContributionModal({
  membershipId,
  ajoId,
  contributionAmount,
  cycleName,
}: PayContributionModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const { cards, isLoading: isLoadingCards } = useUserCards();
  const { chargeContribution, isCharging } = useContributions(ajoId);

  const formatCurrency = (amount: number) => `₦${(amount / 100).toLocaleString()}`;

  const handlePay = async () => {
    try {
      await chargeContribution({
        membershipId,
        ajoId,
        cardId: selectedCardId || undefined,
      });
      setOpen(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const defaultCard = cards.find((c) => c.is_default);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CreditCard className="w-4 h-4" />
          Pay Contribution
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Contribution</DialogTitle>
          <DialogDescription>
            Pay {formatCurrency(contributionAmount)} for {cycleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingCards ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-6">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No cards saved</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please add a card in the Cards section first
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Select a card to use:</p>
              <div className="space-y-2">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-lg border transition-colors",
                      selectedCardId === card.id || (!selectedCardId && card.is_default)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">
                          {card.card_brand} •••• {card.card_last4}
                        </p>
                        {card.bank_name && (
                          <p className="text-sm text-muted-foreground">{card.bank_name}</p>
                        )}
                      </div>
                    </div>
                    {(selectedCardId === card.id || (!selectedCardId && card.is_default)) && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePay}
            disabled={isCharging || cards.length === 0}
          >
            {isCharging ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${formatCurrency(contributionAmount)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

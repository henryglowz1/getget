import { useContributions } from "@/hooks/useContributions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, Receipt } from "lucide-react";

interface ContributionHistoryProps {
  ajoId: string;
}

export function ContributionHistory({ ajoId }: ContributionHistoryProps) {
  const { contributions, isLoading } = useContributions(ajoId);

  const formatCurrency = (amount: number) => `₦${(amount / 100).toLocaleString()}`;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="text-success border-success/30">Completed</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-destructive border-destructive/30">Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-warning border-warning/30">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No contributions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Contributions will appear here once members start paying
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contributions.map((contribution) => {
        const metadata = contribution.metadata as Record<string, any> | null;
        return (
          <div
            key={contribution.id}
            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(contribution.status)}
              <div>
                <p className="font-medium text-foreground">
                  {formatCurrency(contribution.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {contribution.description}
                </p>
                {metadata?.card_last4 && (
                  <p className="text-xs text-muted-foreground">
                    {metadata.card_brand} •••• {metadata.card_last4}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(contribution.status)}
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(contribution.created_at), "MMM d, yyyy h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

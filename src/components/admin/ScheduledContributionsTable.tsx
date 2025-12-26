import { format, isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, RefreshCw, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import type { ScheduledContribution } from "@/hooks/useAdminContributions";

interface ScheduledContributionsTableProps {
  contributions: ScheduledContribution[];
  isLoading: boolean;
  onRetry: (membershipId: string, ajoId: string) => void;
  onResetRetry: (membershipId: string) => void;
  isRetrying: boolean;
  isResetting: boolean;
}

export function ScheduledContributionsTable({
  contributions,
  isLoading,
  onRetry,
  onResetRetry,
  isRetrying,
  isResetting,
}: ScheduledContributionsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getStatusBadge = (contribution: ScheduledContribution) => {
    if (!contribution.next_debit_date) {
      return <Badge variant="secondary">Not Scheduled</Badge>;
    }

    const date = new Date(contribution.next_debit_date);
    const retryCount = contribution.retry_count || 0;

    if (retryCount >= 3) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Max Retries
        </Badge>
      );
    }

    if (isPast(date) && !isToday(date)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </Badge>
      );
    }

    if (isToday(date)) {
      return (
        <Badge className="gap-1 bg-warning text-warning-foreground">
          <Clock className="w-3 h-3" />
          Due Today
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Scheduled
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No scheduled contributions found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Ajo Group</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Next Debit</TableHead>
            <TableHead>Card</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Retries</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributions.map((contribution) => (
            <TableRow key={contribution.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{contribution.profile?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{contribution.profile?.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{contribution.ajo?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {contribution.ajo?.cycle_type}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {contribution.ajo?.contribution_amount
                  ? formatCurrency(contribution.ajo.contribution_amount)
                  : "-"}
              </TableCell>
              <TableCell>
                {contribution.next_debit_date
                  ? format(new Date(contribution.next_debit_date), "MMM d, yyyy HH:mm")
                  : "-"}
              </TableCell>
              <TableCell>
                {contribution.card_last4 ? (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {contribution.card_brand} •••• {contribution.card_last4}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No card</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(contribution)}</TableCell>
              <TableCell>
                <span
                  className={`font-medium ${
                    (contribution.retry_count || 0) >= 3
                      ? "text-destructive"
                      : (contribution.retry_count || 0) > 0
                      ? "text-warning"
                      : "text-muted-foreground"
                  }`}
                >
                  {contribution.retry_count || 0}/3
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {(contribution.retry_count || 0) >= 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResetRetry(contribution.id)}
                      disabled={isResetting}
                    >
                      Reset
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onRetry(contribution.id, contribution.ajo_id)}
                    disabled={isRetrying || !contribution.authorization_code}
                    className="gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Charge Now
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

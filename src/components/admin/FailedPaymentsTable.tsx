import { format } from "date-fns";
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
import { XCircle, RefreshCw } from "lucide-react";
import type { FailedPayment } from "@/hooks/useAdminContributions";

interface FailedPaymentsTableProps {
  payments: FailedPayment[];
  isLoading: boolean;
  onRetry: (membershipId: string, ajoId: string) => void;
  isRetrying: boolean;
}

export function FailedPaymentsTable({
  payments,
  isLoading,
  onRetry,
  isRetrying,
}: FailedPaymentsTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getFailureReason = (payment: FailedPayment) => {
    if (payment.metadata?.failure_reason) {
      return payment.metadata.failure_reason;
    }
    if (payment.description) {
      return payment.description;
    }
    return "Unknown error";
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

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No failed payments found</p>
        <p className="text-sm mt-1">All contributions are processing normally</p>
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
            <TableHead>Failed At</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{payment.profile?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{payment.profile?.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{payment.ajo?.name || "Unknown"}</p>
              </TableCell>
              <TableCell className="font-medium text-destructive">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                {format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>
                <Badge variant="destructive" className="max-w-[200px] truncate">
                  {getFailureReason(payment)}
                </Badge>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {payment.provider_reference?.slice(0, 12) || "-"}...
                </code>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (payment.membership_id && payment.ajo_id) {
                      onRetry(payment.membership_id, payment.ajo_id);
                    }
                  }}
                  disabled={isRetrying || !payment.membership_id || !payment.ajo_id}
                  className="gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

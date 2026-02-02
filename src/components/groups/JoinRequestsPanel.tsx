import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGroupJoinRequests } from "@/hooks/usePublicGroups";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, UserPlus, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JoinRequestsPanelProps {
  groupId: string;
}

export function JoinRequestsPanel({ groupId }: JoinRequestsPanelProps) {
  const { requests, isLoading, approveRequest, rejectRequest } =
    useGroupJoinRequests(groupId);
  const { toast } = useToast();
  const [rejectingRequest, setRejectingRequest] = useState<{
    id: string;
    userName: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (requestId: string, userName: string) => {
    try {
      await approveRequest.mutateAsync(requestId);
      toast({
        title: "Request approved",
        description: `${userName} has been added to the group.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to approve",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectClick = (requestId: string, userName: string) => {
    setRejectingRequest({ id: requestId, userName });
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectingRequest) return;

    try {
      await rejectRequest.mutateAsync({
        requestId: rejectingRequest.id,
        reason: rejectionReason.trim() || undefined,
      });
      toast({
        title: "Request rejected",
        description: `${rejectingRequest.userName}'s request has been rejected.`,
      });
      setRejectingRequest(null);
      setRejectionReason("");
    } catch (error: any) {
      toast({
        title: "Failed to reject",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
          <UserPlus className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No pending requests</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-muted/50 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {request.profile?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {request.profile?.full_name || "Unknown User"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {request.profile?.email}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(request.created_at), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            {request.message && (
              <p className="text-sm text-muted-foreground bg-background rounded-md p-3 italic">
                "{request.message}"
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() =>
                  handleRejectClick(
                    request.id,
                    request.profile?.full_name || "User"
                  )
                }
                disabled={rejectRequest.isPending}
              >
                <X className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="hero"
                className="flex-1"
                onClick={() =>
                  handleApprove(request.id, request.profile?.full_name || "User")
                }
                disabled={approveRequest.isPending}
              >
                {approveRequest.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={!!rejectingRequest}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingRequest(null);
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              You're about to reject {rejectingRequest?.userName}'s request to
              join. You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason (optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Group is currently at capacity, try again next month..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be shown to the user in their notification.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingRequest(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectRequest.isPending}
            >
              {rejectRequest.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

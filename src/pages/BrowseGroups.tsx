import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Users,
  Calendar,
  Wallet,
  Globe,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { usePublicGroups, useJoinRequest } from "@/hooks/usePublicGroups";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function BrowseGroups() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: groups, isLoading } = usePublicGroups();
  const { createRequest } = useJoinRequest();
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredGroups = (groups || []).filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    `₦${(amount / 100).toLocaleString()}`;

  const handleJoinRequest = async () => {
    if (!selectedGroup) return;

    setIsSubmitting(true);
    try {
      await createRequest.mutateAsync({
        groupId: selectedGroup,
        message: message.trim() || undefined,
      });

      toast({
        title: "Request sent!",
        description: "The group admin will review your request.",
      });

      setSelectedGroup(null);
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Failed to send request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
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
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-6 h-6 text-primary" />
              <h1 className="font-display text-2xl font-bold text-foreground">
                Browse Public Groups
              </h1>
            </div>
            <p className="text-muted-foreground">
              Discover and join open Ajo groups in your community
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search groups by name or description..."
            className="pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-card rounded-xl border border-border/50 p-5 shadow-soft hover:shadow-card transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {group.memberCount} / {group.max_members}
                    </div>
                  </div>
                </div>
              </div>

              {group.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Wallet className="w-3.5 h-3.5" />
                    Contribution
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(group.contribution_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {group.cycle_type}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Starts
                  </div>
                  <p className="font-semibold text-foreground">
                    {format(new Date(group.start_date), "MMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(group.start_date), "yyyy")}
                  </p>
                </div>
              </div>

              {/* Action */}
              {group.hasRequested ? (
                <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-muted rounded-lg text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Request Pending</span>
                </div>
              ) : group.memberCount >= group.max_members ? (
                <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-muted rounded-lg text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Group Full</span>
                </div>
              ) : (
                <Dialog
                  open={selectedGroup === group.id}
                  onOpenChange={(open) => {
                    setSelectedGroup(open ? group.id : null);
                    if (!open) setMessage("");
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="hero" className="w-full">
                      Request to Join
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Join {group.name}</DialogTitle>
                      <DialogDescription>
                        Send a request to join this group. The group admin will
                        review your request.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Contribution
                          </span>
                          <span className="font-medium">
                            {formatCurrency(group.contribution_amount)} /{" "}
                            {group.cycle_type}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Members
                          </span>
                          <span className="font-medium">
                            {group.memberCount} / {group.max_members}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">
                          Message (optional)
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Introduce yourself to the group admin..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedGroup(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="hero"
                        onClick={handleJoinRequest}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Request"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              No public groups found
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "Check back later for new public groups"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

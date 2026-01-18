import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  Plus, 
  Search, 
  Users, 
  Calendar, 
  ChevronRight,
  CheckCircle2,
  Globe,
  Lock,
  Clock,
  Wallet,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAllGroups } from "@/hooks/useAllGroups";
import { useJoinRequest } from "@/hooks/usePublicGroups";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: groups, isLoading } = useAllGroups();
  const { createRequest } = useJoinRequest();
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredGroups = (groups || []).filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => `₦${(amount / 100).toLocaleString()}`;

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
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
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
            <h1 className="font-display text-2xl font-bold text-foreground">Ajo Groups</h1>
            <p className="text-muted-foreground">Discover and join contribution groups</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/dashboard/groups/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Link>
          </Button>
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
              <div className="flex items-start justify-between mb-3">
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
                <div className="flex flex-col items-end gap-1">
                  {group.is_public ? (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Globe className="w-3 h-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Lock className="w-3 h-3" />
                      Private
                    </Badge>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    group.status === "active" 
                      ? "bg-success/10 text-success" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {group.status === "active" ? "Active" : "Completed"}
                  </span>
                </div>
              </div>

              {group.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {group.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Wallet className="w-3 h-3" />
                    Contribution
                  </div>
                  <p className="font-semibold text-foreground text-sm">
                    {formatCurrency(group.contribution_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {group.cycle_type}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Calendar className="w-3 h-3" />
                    Start Date
                  </div>
                  <p className="font-semibold text-foreground text-sm">
                    {format(new Date(group.start_date), "MMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(group.start_date), "yyyy")}
                  </p>
                </div>
              </div>

              {/* Payout Coming Soon Banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 mb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Automated Payouts Coming Soon!</span>
                </div>
              </div>

              {/* Actions based on membership status */}
              {group.isMember ? (
                <Link
                  to={`/dashboard/groups/${group.id}`}
                  className="flex items-center justify-between w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>View Group</span>
                    {group.userPosition && (
                      <span className="text-xs opacity-80">• Position #{group.userPosition}</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : group.hasRequested ? (
                <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-muted rounded-lg text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Request Pending</span>
                </div>
              ) : group.memberCount >= group.max_members ? (
                <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-muted rounded-lg text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Group Full</span>
                </div>
              ) : group.is_public ? (
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
                        Send a request to join this group. The group admin will review your request.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Contribution</span>
                          <span className="font-medium">
                            {formatCurrency(group.contribution_amount)} / {group.cycle_type}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Members</span>
                          <span className="font-medium">
                            {group.memberCount} / {group.max_members}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message (optional)</Label>
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
                      <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                        Cancel
                      </Button>
                      <Button variant="hero" onClick={handleJoinRequest} disabled={isSubmitting}>
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
              ) : (
                <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-muted rounded-lg text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Invite Only</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No groups found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term" : "Create your first Ajo group to get started"}
            </p>
            <Button variant="hero" asChild>
              <Link to="/dashboard/groups/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Link>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

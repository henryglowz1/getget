import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MembersList } from "@/components/groups/MembersList";
import { InviteMemberModal } from "@/components/groups/InviteMemberModal";
import { PayContributionModal } from "@/components/groups/PayContributionModal";
import { ContributionHistory } from "@/components/groups/ContributionHistory";
import { JoinRequestsPanel } from "@/components/groups/JoinRequestsPanel";
import { useGroupDetail } from "@/hooks/useGroupDetail";
import { useGroupJoinRequests } from "@/hooks/usePublicGroups";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Users,
  Calendar,
  Wallet,
  Clock,
  Crown,
  TrendingUp,
  Receipt,
  Globe,
  Lock,
  UserPlus,
  Percent,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    group,
    members,
    invites,
    isLoading,
    isCreator,
    isMember,
    createInvite,
    deleteInvite,
  } = useGroupDetail(id);

  const { requests: joinRequests } = useGroupJoinRequests(id);

  // Find current user's membership
  const currentMembership = members.find((m) => m.user_id === user?.id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-fade-in space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">Group not found</h2>
          <p className="text-muted-foreground mb-4">
            This group may have been deleted or you don't have access to it.
          </p>
          <Button asChild>
            <Link to="/dashboard/groups">Back to Groups</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const progress = group.current_cycle
    ? Math.round((group.current_cycle / group.max_members) * 100)
    : 0;

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString()}`;

  const handleInvite = async (email: string) => {
    await createInvite.mutateAsync(email);
  };

  const handleDeleteInvite = async (inviteId: string) => {
    await deleteInvite.mutateAsync(inviteId);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/dashboard/groups">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Groups
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {group.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    {group.name}
                  </h1>
                  {isCreator && <Crown className="w-5 h-5 text-warning" />}
                  {(group as any).is_public ? (
                    <Badge variant="secondary" className="gap-1">
                      <Globe className="w-3 h-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="w-3 h-3" />
                      Private
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{group.description || "No description"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {currentMembership && (
              <PayContributionModal
                membershipId={currentMembership.id}
                ajoId={group.id}
                contributionAmount={group.contribution_amount}
                cycleName={`Cycle ${group.current_cycle || 1}`}
              />
            )}
            {isCreator && (
              <InviteMemberModal
                groupId={group.id}
                groupName={group.name}
                invites={invites}
                onInvite={handleInvite}
                onDeleteInvite={handleDeleteInvite}
                isLoading={createInvite.isPending}
              />
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Contribution</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(group.contribution_amount / 100)}
            </p>
            <p className="text-sm text-muted-foreground capitalize">{group.cycle_type}</p>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Members</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {members.length} / {group.max_members}
            </p>
            <p className="text-sm text-muted-foreground">
              {group.max_members - members.length} spots left
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Start Date</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {format(new Date(group.start_date), "MMM d, yyyy")}
            </p>
            <p className="text-sm text-muted-foreground capitalize">{group.status}</p>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Pool</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency((group.contribution_amount * members.length) / 100)}
            </p>
            <p className="text-sm text-muted-foreground">per cycle</p>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Platform Fee</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {(group as any).fee_percentage ?? 6.25}%
            </p>
            <p className="text-sm text-muted-foreground">deducted from payout</p>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Est. Payout</span>
            </div>
            {(() => {
              const grossAmount = (group.contribution_amount * members.length) / 100;
              const feePercentage = (group as any).fee_percentage ?? 6.25;
              const feeAmount = grossAmount * feePercentage / 100;
              const netAmount = grossAmount - feeAmount;
              return (
                <>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(Math.round(netAmount))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    after {feePercentage}% fee
                  </p>
                </>
              );
            })()}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Cycle Progress
            </h2>
            <span className="text-sm font-medium text-foreground">
              Cycle {group.current_cycle || 1} of {group.max_members}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {progress}% complete
          </p>
        </div>

        {/* Members */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Members ({members.length})
            </h2>
          </div>
          <MembersList
            members={members}
            creatorId={group.creator_id}
            currentUserId={user?.id}
          />
        </div>

        {/* Join Requests - Only visible to creator */}
        {isCreator && (group as any).is_public && (
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Join Requests
                {joinRequests.length > 0 && (
                  <Badge variant="default" className="ml-2">
                    {joinRequests.length}
                  </Badge>
                )}
              </h2>
            </div>
            <JoinRequestsPanel groupId={group.id} />
          </div>
        )}
        {/* Contribution History */}
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Contribution History
            </h2>
          </div>
          <ContributionHistory ajoId={group.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}

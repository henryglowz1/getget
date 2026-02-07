import { useState } from "react";
import { GroupMember } from "@/hooks/useGroupDetail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, User, AtSign, UserMinus, Loader2 } from "lucide-react";

interface MembersListProps {
  members: GroupMember[];
  creatorId: string | null;
  currentUserId?: string;
  isCreator?: boolean;
  onRemoveMember?: (membershipId: string) => Promise<void>;
  isRemovingMember?: boolean;
}

export function MembersList({
  members,
  creatorId,
  currentUserId,
  isCreator = false,
  onRemoveMember,
  isRemovingMember = false,
}: MembersListProps) {
  const [removingMember, setRemovingMember] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleRemoveConfirm = async () => {
    if (!removingMember || !onRemoveMember) return;
    await onRemoveMember(removingMember.id);
    setRemovingMember(null);
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No members yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {members.map((member) => {
          const isMemberCreator = member.user_id === creatorId;
          const isCurrentUser = member.user_id === currentUserId;
          const initials = member.profile?.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "?";

          const canRemove = isCreator && !isMemberCreator && !isCurrentUser;

          return (
            <div
              key={member.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isCurrentUser
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border/50 hover:border-primary/20"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                #{member.position}
              </div>

              <Avatar className="h-10 w-10">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">
                    {member.profile?.full_name || "Unknown"}
                  </p>
                  {isMemberCreator && (
                    <Crown className="w-4 h-4 text-warning flex-shrink-0" />
                  )}
                  {isCurrentUser && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {member.profile?.username ? (
                    <span className="flex items-center gap-0.5 truncate">
                      <AtSign className="w-3 h-3" />
                      {member.profile.username}
                    </span>
                  ) : (
                    <span className="truncate">{member.profile?.email}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={member.is_active ? "default" : "secondary"}
                  className={member.is_active ? "bg-success/10 text-success border-success/20" : ""}
                >
                  {member.is_active ? "Active" : "Inactive"}
                </Badge>

                {canRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      setRemovingMember({
                        id: member.id,
                        name: member.profile?.full_name || "this member",
                      })
                    }
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={!!removingMember}
        onOpenChange={(open) => {
          if (!open) setRemovingMember(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {removingMember?.name}
              </span>{" "}
              from this group? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemovingMember}
            >
              {isRemovingMember ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

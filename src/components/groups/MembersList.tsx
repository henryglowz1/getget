import { GroupMember } from "@/hooks/useGroupDetail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, User } from "lucide-react";

interface MembersListProps {
  members: GroupMember[];
  creatorId: string | null;
  currentUserId?: string;
}

export function MembersList({ members, creatorId, currentUserId }: MembersListProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCreator = member.user_id === creatorId;
        const isCurrentUser = member.user_id === currentUserId;
        const initials = member.profile?.full_name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "?";

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
                {isCreator && (
                  <Crown className="w-4 h-4 text-warning flex-shrink-0" />
                )}
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">You</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {member.profile?.email}
              </p>
            </div>

            <Badge 
              variant={member.is_active ? "default" : "secondary"}
              className={member.is_active ? "bg-success/10 text-success border-success/20" : ""}
            >
              {member.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

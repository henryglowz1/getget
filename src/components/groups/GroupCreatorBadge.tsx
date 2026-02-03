import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface GroupCreatorBadgeProps {
  creatorName: string | null;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  size?: "sm" | "md";
}

export function GroupCreatorBadge({
  creatorName,
  creatorUsername,
  creatorAvatarUrl,
  size = "sm",
}: GroupCreatorBadgeProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = creatorUsername ? `@${creatorUsername}` : creatorName || "Unknown";

  const avatarSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-1.5">
      <Avatar className={avatarSize}>
        <AvatarImage src={creatorAvatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
          {creatorName ? getInitials(creatorName) : <User className="w-3 h-3" />}
        </AvatarFallback>
      </Avatar>
      <span className={`${textSize} text-muted-foreground truncate max-w-[100px]`}>
        {displayName}
      </span>
    </div>
  );
}

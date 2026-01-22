import { Trophy, Medal, Award, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReferralLeaderboard } from "@/hooks/useReferralLeaderboard";

function formatAmount(amountInKobo: number): string {
  return `₦${(amountInKobo / 100).toLocaleString()}`;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ReferralLeaderboard() {
  const { data: leaderboard, isLoading } = useReferralLeaderboard(10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No referrals completed yet.</p>
            <p className="text-sm">Be the first to refer friends and earn rewards!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top Referrers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                index < 3 ? "bg-muted/50" : ""
              }`}
            >
              <div className="flex items-center justify-center w-6">
                {getRankIcon(index + 1)}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={entry.avatar_url || undefined} alt={entry.full_name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(entry.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{entry.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.successful_referrals} referral{entry.successful_referrals !== 1 ? "s" : ""}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-primary">
                  {formatAmount(entry.total_earnings)}
                </p>
                <p className="text-xs text-muted-foreground">earned</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

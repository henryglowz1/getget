import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, CheckCircle2, XCircle, LogIn } from "lucide-react";

export default function AcceptInvite() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [group, setGroup] = useState<{ id: string; name: string; max_members: number } | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId) {
        setError("Invalid invite link");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from("ajos")
          .select("id, name, max_members")
          .eq("id", groupId)
          .single();

        if (groupError || !groupData) {
          setError("Group not found or invite has expired");
          setIsLoading(false);
          return;
        }

        setGroup(groupData);

        // Get member count
        const { count } = await supabase
          .from("memberships")
          .select("*", { count: "exact", head: true })
          .eq("ajo_id", groupId)
          .eq("is_active", true);

        setMemberCount(count || 0);

        // Check if user is already a member
        if (user) {
          const { data: membership } = await supabase
            .from("memberships")
            .select("id")
            .eq("ajo_id", groupId)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .single();

          if (membership) {
            setAlreadyMember(true);
          }
        }
      } catch (err) {
        setError("Failed to load group details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId, user]);

  const handleJoinGroup = async () => {
    if (!user || !group) return;

    setIsJoining(true);
    try {
      // Check if group is full
      if (memberCount >= group.max_members) {
        toast({
          title: "Group is full",
          description: "This group has reached its maximum number of members.",
          variant: "destructive",
        });
        return;
      }

      // Add user to memberships
      const { error: membershipError } = await supabase
        .from("memberships")
        .insert({
          ajo_id: group.id,
          user_id: user.id,
          position: memberCount + 1,
          is_active: true,
        });

      if (membershipError) {
        if (membershipError.code === "23505") {
          // Unique violation - already a member
          toast({
            title: "Already a member",
            description: "You are already a member of this group.",
          });
          navigate(`/dashboard/groups/${group.id}`);
          return;
        }
        throw membershipError;
      }

      toast({
        title: "Joined successfully!",
        description: `You are now a member of ${group.name}`,
      });

      navigate(`/dashboard/groups/${group.id}`);
    } catch (err) {
      toast({
        title: "Failed to join group",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invite</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link to="/dashboard/groups">View My Groups</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen pt-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Already a Member</h1>
            <p className="text-muted-foreground mb-6">
              You are already a member of {group?.name}
            </p>
            <Button asChild>
              <Link to={`/dashboard/groups/${group?.id}`}>View Group</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen pt-20 px-4">
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Join {group?.name}
          </h1>
          <p className="text-muted-foreground mb-6">
            You've been invited to join this Ajo group
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Members</span>
              <span className="font-medium text-foreground">
                {memberCount} / {group?.max_members}
              </span>
            </div>
          </div>

          {user ? (
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleJoinGroup}
              disabled={isJoining || memberCount >= (group?.max_members || 0)}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : memberCount >= (group?.max_members || 0) ? (
                "Group is Full"
              ) : (
                "Join Group"
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Please sign in to join this group
              </p>
              <Button variant="hero" size="lg" className="w-full" asChild>
                <Link to={`/login?redirect=/invite/${groupId}`}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Join
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to={`/register?redirect=/invite/${groupId}`} className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

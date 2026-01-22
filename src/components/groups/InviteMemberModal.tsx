import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GroupInvite } from "@/hooks/useGroupDetail";
import { Copy, Link, Mail, Plus, Trash2, UserPlus, AtSign, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InviteMemberModalProps {
  groupId: string;
  groupName: string;
  invites: GroupInvite[];
  onInvite: (email: string) => Promise<void>;
  onDeleteInvite: (inviteId: string) => Promise<void>;
  isLoading: boolean;
}

export function InviteMemberModal({
  groupId,
  groupName,
  invites,
  onInvite,
  onDeleteInvite,
  isLoading,
}: InviteMemberModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const inviteLink = `${window.location.origin}/invite/${groupId}`;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    try {
      await onInvite(email);
      setEmail("");
      toast({
        title: "Invitation sent!",
        description: `An invite has been created for ${email}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send invite",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsSearching(true);
    try {
      const cleanUsername = username.replace("@", "").toLowerCase().trim();
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("email, username")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        toast({
          title: "User not found",
          description: `No user found with username @${cleanUsername}`,
          variant: "destructive",
        });
        return;
      }

      await onInvite(profile.email);
      setUsername("");
      toast({
        title: "Invitation sent!",
        description: `An invite has been sent to @${cleanUsername}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send invite",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setIsSearching(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "").trim();
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("email, phone")
        .eq("phone", cleanPhone)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        toast({
          title: "User not found",
          description: `No user found with phone number ${phone}`,
          variant: "destructive",
        });
        return;
      }

      await onInvite(profile.email);
      setPhone("");
      toast({
        title: "Invitation sent!",
        description: `An invite has been sent to the user with phone ${phone}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send invite",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copied!",
      description: "Share this link to invite members to the group.",
    });
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      await onDeleteInvite(inviteId);
      toast({
        title: "Invite cancelled",
        description: "The invitation has been revoked.",
      });
    } catch {
      toast({
        title: "Failed to cancel invite",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {groupName}</DialogTitle>
          <DialogDescription>
            Find members by username, phone, email, or share the group link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Tabs defaultValue="username" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="username" className="text-xs">
                <AtSign className="w-3 h-3 mr-1" />
                Username
              </TabsTrigger>
              <TabsTrigger value="phone" className="text-xs">
                <Phone className="w-3 h-3 mr-1" />
                Phone
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs">
                <Mail className="w-3 h-3 mr-1" />
                Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="username" className="mt-4">
              <form onSubmit={handleUsernameSubmit} className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="username"
                      className="pl-10 lowercase"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSearching || !username}>
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="phone" className="mt-4">
              <form onSubmit={handlePhoneSubmit} className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="08012345678"
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSearching || !phone}>
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <form onSubmit={handleEmailSubmit} className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="member@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isSending || !email}>
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {/* Share link */}
          <div className="space-y-2">
            <Label>Or share invite link</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={inviteLink}
                  readOnly
                  className="pl-10 text-sm"
                />
              </div>
              <Button variant="outline" onClick={copyInviteLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <Label>Pending invites</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                  >
                    <span className="truncate">{invite.invitee_email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteInvite(invite.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

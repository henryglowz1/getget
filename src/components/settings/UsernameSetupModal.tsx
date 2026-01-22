import { useState } from "react";
import { AtSign, Check, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UsernameSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export function UsernameSetupModal({ open, onComplete }: UsernameSetupModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 20) return "Username must be less than 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Only letters, numbers, and underscores allowed";
    if (/^[0-9]/.test(value)) return "Username cannot start with a number";
    return null;
  };

  const checkAvailability = async (value: string) => {
    const validationError = validateUsername(value);
    if (validationError) {
      setError(validationError);
      setIsAvailable(null);
      return;
    }

    setError(null);
    setIsChecking(true);
    
    try {
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", value.toLowerCase())
        .maybeSingle();

      if (queryError) throw queryError;
      
      setIsAvailable(!data);
      if (data) {
        setError("Username is already taken");
      }
    } catch (err) {
      console.error("Error checking username:", err);
      setError("Failed to check availability");
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(value);
    setIsAvailable(null);
    setError(null);
    
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => checkAvailability(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAvailable) return;
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: username.toLowerCase() })
        .eq("user_id", user.id);

      if (updateError) {
        if (updateError.code === "23505") {
          setError("Username is already taken");
          setIsAvailable(false);
        } else {
          throw updateError;
        }
        return;
      }

      toast({
        title: "Username set!",
        description: `Your username is now @${username}`,
      });
      onComplete();
    } catch (err) {
      console.error("Error setting username:", err);
      toast({
        title: "Failed to set username",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AtSign className="h-5 w-5 text-primary" />
            Set Up Your Username
          </DialogTitle>
          <DialogDescription>
            Choose a unique username for your account. This will make it easier for others to invite you to groups. 
            <span className="block mt-2 text-warning font-medium">
              ⚠️ Username cannot be changed once set.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={handleUsernameChange}
                placeholder="yourname"
                className="pl-8 pr-10 lowercase"
                maxLength={20}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!isChecking && isAvailable === true && <Check className="h-4 w-4 text-success" />}
                {!isChecking && isAvailable === false && <X className="h-4 w-4 text-destructive" />}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {isAvailable && !error && (
              <p className="text-sm text-success">Username is available!</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters. Letters, numbers, and underscores only.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isAvailable || isSaving || !!error}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting username...
              </>
            ) : (
              "Confirm Username"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

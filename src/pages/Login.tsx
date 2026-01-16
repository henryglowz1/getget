import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Wallet, Mail, Lock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signIn, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const redirectUrl = searchParams.get("redirect");

  useEffect(() => {
    if (user && !requires2FA) {
      navigate(redirectUrl || "/dashboard");
    }
  }, [user, navigate, redirectUrl, requires2FA]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setIsLoading(false);
      toast({
        title: "Sign in failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive"
      });
      return;
    }

    // Check if user has 2FA enabled
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      try {
        const { data, error: checkError } = await supabase.functions.invoke("check-2fa-status", {
          body: { user_id: authUser.id },
        });

        if (!checkError && data?.success && data?.data?.isEnabled) {
          // User has 2FA enabled, sign out and show 2FA prompt
          await supabase.auth.signOut();
          setPendingUserId(authUser.id);
          setRequires2FA(true);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error checking 2FA status:", err);
      }
    }

    toast({
      title: "Welcome back!",
      description: "You've successfully signed in.",
    });
    setIsLoading(false);
    navigate(redirectUrl || "/dashboard");
  };

  const handle2FASuccess = async () => {
    // 2FA verified, complete the sign in
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      setRequires2FA(false);
      setPendingUserId(null);
      return;
    }

    toast({
      title: "Welcome back!",
      description: "You've successfully signed in with 2FA.",
    });
    setRequires2FA(false);
    setPendingUserId(null);
    navigate(redirectUrl || "/dashboard");
  };

  const handle2FACancel = () => {
    setRequires2FA(false);
    setPendingUserId(null);
    setPassword("");
  };

  // Show 2FA verification screen
  if (requires2FA && pendingUserId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="min-h-screen flex items-center justify-center pt-16 px-4">
          <div className="w-full max-w-md">
            <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 lg:p-8">
              <TwoFactorVerify
                userId={pendingUserId}
                purpose="login"
                onSuccess={handle2FASuccess}
                onCancel={handle2FACancel}
                title="Two-Factor Authentication"
                description="Enter the code from your authenticator app to sign in"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="min-h-screen flex items-center justify-center pt-16 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow mb-4">
              <Wallet className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"} className="text-primary font-medium hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
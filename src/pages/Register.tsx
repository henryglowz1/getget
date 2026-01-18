import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Wallet, Mail, Lock, User, Phone, ArrowRight, CheckCircle2, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    manualReferralCode: ""
  });

  const urlReferralCode = searchParams.get("ref");
  const redirectUrl = searchParams.get("redirect");
  
  // Use URL referral code if available, otherwise use manually entered code
  const referralCode = urlReferralCode || formData.manualReferralCode.trim();

  useEffect(() => {
    if (user) {
      navigate(redirectUrl || "/dashboard");
    }
  }, [user, navigate, redirectUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Validate referral code exists before registration
    let validatedReferrer: { user_id: string } | null = null;
    if (referralCode) {
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", referralCode.toUpperCase())
        .single();

      if (!referrerProfile) {
        setIsLoading(false);
        toast({
          title: "Invalid referral code",
          description: "The referral code you entered doesn't exist. Please check and try again.",
          variant: "destructive"
        });
        return;
      }
      validatedReferrer = referrerProfile;
    }
    
    const result = await signUp(
      formData.email, 
      formData.password, 
      formData.name,
      formData.phone
    );
    
    if (result.error) {
      setIsLoading(false);
      toast({
        title: "Registration failed",
        description: result.error.message.includes("already registered")
          ? "This email is already registered. Please sign in instead."
          : result.error.message,
        variant: "destructive"
      });
      return;
    }

    // If there's a validated referral code, create referral record
    if (validatedReferrer && result.data?.user) {
      try {
        // Create referral record with reward amount (₦200 = 20000 kobo)
        await supabase
          .from("referrals")
          .insert({
            referrer_id: validatedReferrer.user_id,
            referred_user_id: result.data.user.id,
            referral_code: referralCode.toUpperCase(),
            status: "pending",
            reward_amount: 20000, // ₦200 in kobo
          });
        
        // Also update the new user's profile with referred_by
        await supabase
          .from("profiles")
          .update({ referred_by: validatedReferrer.user_id })
          .eq("user_id", result.data.user.id);
          
        toast({
          title: "Referral applied!",
          description: "Your referrer will receive ₦200 when you fund your wallet.",
        });
      } catch (err) {
        console.error("Failed to create referral record:", err);
        // Don't block registration if referral fails
      }
    }

    toast({
      title: "Account created!",
      description: "Welcome to AjoConnect. Let's get you started.",
    });
    navigate(redirectUrl || "/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow mb-4">
              <Wallet className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Create Your Account
            </h1>
            <p className="text-muted-foreground">
              Start your automated savings journey today
            </p>
            {urlReferralCode && (
              <p className="text-sm text-primary mt-2">
                🎉 Using referral code: <span className="font-mono font-bold">{urlReferralCode}</span>
              </p>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-11"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-11"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="08X XXX XXXX"
                    className="pl-11"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    className="pl-11"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-11"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Manual Referral Code Input - only show if no URL referral code */}
              {!urlReferralCode && (
                <div className="space-y-2">
                  <Label htmlFor="manualReferralCode">Referral Code (Optional)</Label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="manualReferralCode"
                      name="manualReferralCode"
                      type="text"
                      placeholder="Enter referral code"
                      className="pl-11 uppercase"
                      value={formData.manualReferralCode}
                      onChange={handleChange}
                      maxLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Have a friend's referral code? Enter it to give them a bonus!
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            {/* Benefits */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="space-y-2">
                {["Automated contributions", "Secure card linking", "Real-time tracking"].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
